import { payoutRepository } from "./payout.repository";
import { userService } from "@/modules/user/user.service";
import { decrypt } from "@/lib/cryptography";
import { sendPix } from "@/lib/abacate-pay";
import { resend } from "@/lib/resend";
import TeacherPayoutEmail from "../communication/templates/TeacherPayoutEmail";
import { db } from "@/lib/db";
import { and, between, eq } from "drizzle-orm";
import { slotInstances } from "../scheduling/scheduling.schema";
import { payoutsTable } from "./payout.schema";

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

    const decryptedPixKey = teacher.pixKey.includes(":") ? decrypt(teacher.pixKey) : teacher.pixKey;

    // 2. Call AbacatePay
    const abacateResponse = await sendPix({
      amount: totalAmount,
      pixKey: decryptedPixKey,
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
        from: "FluencyLab <financeiro@fluencylab.me>",
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

  async getEarningsProjections(teacherId: string, month?: number, year?: number) {
    const today = new Date();
    const targetMonth = month !== undefined ? month : today.getMonth();
    const targetYear = year !== undefined ? year : today.getFullYear();

    const teacher = await userService.getUserById(teacherId);
    if (!teacher) throw new Error("Teacher not found");

    let start: Date;
    let end: Date;

    if (targetMonth === -1) {
      // All months of the target year
      start = new Date(targetYear, 0, 1);
      end = new Date(targetYear, 11, 31, 23, 59, 59);
    } else {
      start = new Date(targetYear, targetMonth, 1);
      end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    }

    // 1. Pending (Completed but unpaid classes in the target range)
    const unpaidStart = targetYear === today.getFullYear() ? new Date(2000, 0, 1) : start;
    const unpaidClasses = await payoutRepository.findUnpaidClassesByTeacher(teacherId, unpaidStart, end);
    const pendingAmount = unpaidClasses.reduce((sum, cls) => sum + (cls.teacherHourlyRate ?? teacher.teacherHourlyRate), 0);

    // 2. Projected (Scheduled in the future for the target range)
    let futureStart = start;
    if (targetMonth === -1) {
      if (targetYear === today.getFullYear()) {
        futureStart = today;
      } else if (targetYear < today.getFullYear()) {
        futureStart = end;
      }
    } else {
      if (targetYear === today.getFullYear() && targetMonth === today.getMonth()) {
        futureStart = today;
      } else if (new Date(targetYear, targetMonth, 1) < new Date(today.getFullYear(), today.getMonth(), 1)) {
        futureStart = end;
      }
    }

    let projectedAmount = 0;
    if (futureStart < end) {
      const futureClasses = await db.query.slotInstances.findMany({
        where: and(
          eq(slotInstances.teacherId, teacherId),
          eq(slotInstances.status, "scheduled"),
          between(slotInstances.startAt, futureStart, end)
        )
      });
      projectedAmount = futureClasses.reduce((sum, cls) => sum + (cls.teacherHourlyRate ?? teacher.teacherHourlyRate), 0);
    }

    return {
      pendingAmount,
      projectedAmount,
      totalMonth: pendingAmount + projectedAmount
    };
  },

  async resendPayoutEmail(payoutId: string) {
    const payout = await db.query.payoutsTable.findFirst({
      where: eq(payoutsTable.id, payoutId),
      with: {
        teacher: true,
        classes: {
          with: {
            student: {
              columns: {
                name: true,
              }
            }
          }
        }
      }
    });

    if (!payout) {
      throw new Error("Pagamento não encontrado.");
    }

    const { teacher, classes } = payout;
    if (!teacher) {
      throw new Error("Professor não encontrado para este pagamento.");
    }

    // Send Email Report
    await resend.emails.send({
      from: "FluencyLab <financeiro@fluencylab.me>",
      to: teacher.email,
      subject: `Seu pagamento de ${payout.month + 1}/${payout.year} foi processado! (Reenvio)`,
      react: TeacherPayoutEmail({
        teacherName: teacher.name,
        month: payout.month + 1,
        year: payout.year,
        amount: payout.amount,
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

    return payout;
  }
};
