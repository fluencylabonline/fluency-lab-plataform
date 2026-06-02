import { payoutRepository } from "./payout.repository";
import { userService } from "@/modules/user/user.service";
import { sendPix } from "@/lib/abacate-pay";
import { resend } from "@/lib/resend";
import TeacherPayoutEmail from "../communication/templates/TeacherPayoutEmail";
import { db } from "@/lib/db";
import { and, between, eq } from "drizzle-orm";
import { slotInstances } from "../scheduling/scheduling.schema";

export const payoutService = {
  async getTeacherUnpaidClasses(teacherId: string, month: number, year: number) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    return payoutRepository.findUnpaidClassesByTeacher(teacherId, start, end);
  },

  async processPayout(teacherId: string, month: number, year: number) {
    const teacher = await userService.getUserById(teacherId);
    if (!teacher || !teacher.pixKey || !teacher.pixType) {
      throw new Error("Professor não encontrado ou sem chave PIX configurada.");
    }

    const classes = await this.getTeacherUnpaidClasses(teacherId, month, year);
    if (classes.length === 0) {
      throw new Error("Não há aulas pendentes de pagamento para este período.");
    }

    const totalAmount = classes.reduce((sum, cls) => sum + (cls.teacherHourlyRate ?? teacher.teacherHourlyRate), 0);

    if (totalAmount < 350) {
      throw new Error("O valor mínimo para saque é R$ 3,50.");
    }

    const externalId = `payout-${teacherId}-${month + 1}-${year}-${Date.now()}`;

    // 2. Call AbacatePay
    const abacateResponse = await sendPix({
      amount: totalAmount,
      pixKey: teacher.pixKey,
      pixKeyType: teacher.pixType,
      externalId,
      description: `Pagamento FluencyLab - ${month + 1}/${year}`,
    });

    // 3. Create Payout Record & Link Classes
    const payout = await payoutRepository.createPayout({
      teacherId,
      amount: totalAmount,
      month,
      year,
      status: "completed", // AbacatePay payouts are usually immediate or pending, but we assume success if no error
      abacatePayoutId: abacateResponse.id,
      pixKey: teacher.pixKey,
      pixKeyType: teacher.pixType,
      externalId,
      description: `Pagamento FluencyLab - ${month + 1}/${year}`,
      metadata: {
        classIds: classes.map(c => c.id),
        teacherName: teacher.name,
        emailSent: false
      }
    });

    await payoutRepository.linkClassesToPayout(classes.map(c => c.id), payout.id);

    // 4. Send Email Report
    try {
      await resend.emails.send({
        from: "FluencyLab <financeiro@fluencylab.com.br>",
        to: teacher.email,
        subject: `Seu pagamento de ${month + 1}/${year} foi processado!`,
        react: TeacherPayoutEmail({
          teacherName: teacher.name,
          month: month + 1,
          year,
          amount: totalAmount,
          classes: classes.map(c => ({
            date: c.startAt,
            studentName: c.student?.name || "N/A",
            rate: c.teacherHourlyRate ?? teacher.teacherHourlyRate,
            status: c.status
          }))
        }),
      });

      await payoutRepository.updatePayout(payout.id, {
        metadata: { ...payout.metadata!, emailSent: true }
      });
    } catch (emailError) {
      console.error("[payoutService] Failed to send report email:", emailError);
      // We don't throw here because the payment was already processed
    }

    return payout;
  },

  async getTotalPayouts(start: Date, end: Date) {
    return payoutRepository.sumPayouts({ status: "completed", start, end });
  },

  async getTeacherPayoutHistory(teacherId: string) {
    return payoutRepository.findPayoutsByTeacher(teacherId);
  },

  async getEarningsProjections(teacherId: string) {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Pending (Completed but unpaid)
    const pendingClasses = await payoutRepository.findUnpaidClassesByTeacher(teacherId, new Date(2000, 0, 1), now);
    const teacher = await userService.getUserById(teacherId);
    const pendingAmount = pendingClasses.reduce((sum, cls) => sum + (cls.teacherHourlyRate ?? teacher?.teacherHourlyRate ?? 0), 0);

    // 2. Projected (Scheduled in the future for this month)
    const futureClasses = await db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.teacherId, teacherId),
        eq(slotInstances.status, "scheduled"),
        between(slotInstances.startAt, now, end)
      )
    });
    const projectedAmount = futureClasses.reduce((sum, cls) => sum + (cls.teacherHourlyRate ?? teacher?.teacherHourlyRate ?? 0), 0);

    return {
      pendingAmount,
      projectedAmount,
      totalMonth: pendingAmount + projectedAmount
    };
  }
};
