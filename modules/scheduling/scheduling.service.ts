import { db } from "@/lib/db";
import { schedulingRepository } from "./scheduling.repository";
import { hasPermission } from "@/lib/rbac";
import { UserRoleInfo } from "@/lib/rbac";
import {
  slotInstances,
  recurrenceRules,
  studentCredits,
  schedulingAuditLogs
} from "./scheduling.schema";
import { eq, and, gte } from "drizzle-orm";
import { 
  addWeeks, 
  addMonths, 
  isAfter, 
  isBefore, 
  startOfDay,
  format,
  differenceInHours,
  subHours,
  addHours,
  addMinutes
} from "date-fns";
import { notificationService } from "@/modules/notification/notification.service";

import { userRepository } from "@/modules/user/user.repository";
import { communicationService } from "@/modules/communication/communication.service";

export const schedulingService = {
  // --- Rule Management ---
  async createRule(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    data: typeof recurrenceRules.$inferInsert
  ) {

    if (!hasPermission(user, "class.update.any") && user.id !== data.teacherId) {
      throw new Error("Unauthorized: You can only create rules for yourself or if you are an Admin/Manager");
    }

    const [rule] = await db.insert(recurrenceRules).values(data).returning();
    
    // Auto-materialize first 4 weeks
    await this.materializeFutureSlots(rule.id, 4);

    return rule;
  },

  // --- Student Allocation ---
  // --- Student Allocation ---
  async allocateStudentToRule(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    ruleId: string,
    studentId: string
  ) {
    // RBAC: Admin/Manager can allocate anyone.
    if (!hasPermission(user, "class.update.any")) {
      throw new Error("Unauthorized: Only Admin or Manager can allocate students to rules");
    }

    const rule = await schedulingRepository.findRuleById(ruleId);
    if (!rule) throw new Error("Recurrence Rule not found");

    return await db.transaction(async (tx) => {
      // 1. Update the template
      await tx.update(recurrenceRules)
        .set({ studentId })
        .where(eq(recurrenceRules.id, ruleId));

      // 2. Update future available slots
      const now = new Date();
      await tx.update(slotInstances)
        .set({
          studentId,
          status: "scheduled",
          updatedAt: now
        })
        .where(
          and(
            eq(slotInstances.ruleId, ruleId),
            eq(slotInstances.status, "available"),
            gte(slotInstances.startAt, now)
          )
        );

      // Notification
      const student = await userRepository.findById(studentId);
      if (student) {
        await notificationService.sendNotification({
          title: "Novo Horário Agendado",
          body: `Você foi alocado para um novo horário recorrente iniciando em ${format(rule.startDate, "dd/MM")}.`,
          targetType: "specific",
          userIds: [studentId],
          channels: { inApp: true, push: true },
        });
      }

      return { success: true };
    });
  },

  // --- Class Status Management ---
  async updateClassStatus(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    classId: string,
    status: typeof slotInstances.status.enumValues[number]
  ) {
    // RBAC: Admin/Manager can change to any status.
    if (!hasPermission(user, "class.update.any")) {
      throw new Error("Unauthorized: Only Admin or Manager can manually override class status");
    }

    const slot = await schedulingRepository.findById(classId);
    if (!slot) throw new Error("Slot instance not found");

    await schedulingRepository.updateStatus(classId, status);

    // Audit Log
    await schedulingRepository.createAuditLog({
      slotId: classId,
      actorId: user.id,
      actorRole: user.role,
      previousStatus: slot.status,
      newStatus: status,
      reason: "Manual override by Manager/Admin",
    });

    return { success: true };

  },

  async cancelClass(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    classId: string,
    reason: typeof slotInstances.status.enumValues[number]
  ) {
    const slot = await schedulingRepository.findById(classId);
    if (!slot) throw new Error("Slot not found");

    // RBAC Check
    const isAdmin = hasPermission(user, "class.update.any");
    const isTeacher = user.role === "teacher" && slot.teacherId === user.id;
    const isStudent = user.role === "student" && slot.studentId === user.id;

    if (!isAdmin && !isTeacher && !isStudent) {
      throw new Error("Unauthorized access to this class");
    }

    return await db.transaction(async (tx) => {
      let finalStatus = reason;

      // 1. Notice Period Rule (4h)
      if (user.role === "student" && reason === "canceled-student") {
        const hoursUntilClass = differenceInHours(slot.startAt, new Date());
        if (hoursUntilClass < 4) {
          finalStatus = "no-show"; // Late cancellation = No Show
        }
      }

      // 2. Update slot status
      await tx.update(slotInstances)
        .set({ status: finalStatus, updatedAt: new Date() })
        .where(eq(slotInstances.id, classId));

      // 2.1 Audit Log (part of transaction)
      // Note: We use schedulingAuditLogs table directly for transaction safety
      await tx.insert(schedulingAuditLogs).values({
        slotId: classId,
        actorId: user.id,
        actorRole: user.role,
        previousStatus: slot.status,
        newStatus: finalStatus,
        reason: `Canceled with reason: ${reason}`,
      });


      // 3. If canceled-teacher-makeup AND met the notice period (if applicable)
      if (reason === "canceled-teacher-makeup" && slot.studentId) {
        // Default expiration: 30 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await tx.insert(studentCredits).values({
          studentId: slot.studentId,
          type: "teacher-cancellation",
          amount: 1,
          expiresAt: expiresAt,
          grantedBy: user.id,
          reason: `Auto-granted due to teacher cancellation of class on ${slot.startAt.toLocaleDateString()}`,
        });

        // Notification: Credit Granted
        await notificationService.sendNotification({
          title: "Crédito de Reposição Recebido",
          body: `O professor cancelou a aula de ${format(slot.startAt, "dd/MM")}. Você recebeu 1 crédito de reposição.`,
          targetType: "specific",
          userIds: [slot.studentId],
          channels: { inApp: true, push: true },
        });
      } else if (slot.studentId) {
        // Notification: Simple Cancellation
        const targetUserId = finalStatus === "no-show" ? null : (reason === "canceled-student" ? slot.teacherId : slot.studentId);
        
        if (finalStatus === "no-show") {
            // Special notification for Late Cancellation
             await notificationService.sendNotification({
              title: "Aula Perdida (Cancelamento Tardio)",
              body: `Sua aula de ${format(slot.startAt, "dd/MM HH:mm")} foi marcada como No-Show devido ao aviso inferior a 4h.`,
              targetType: "specific",
              userIds: [slot.studentId],
              channels: { inApp: true, push: true },
            });
        } else if (targetUserId) {
            const roleName = reason === "canceled-student" ? "O aluno" : "O professor";
            await notificationService.sendNotification({
              title: "Aula Cancelada",
              body: `${roleName} cancelou a aula agendada para ${format(slot.startAt, "dd/MM HH:mm")}.`,
              targetType: "specific",
              userIds: [targetUserId],
              channels: { inApp: true, push: true },
            });
        }
      }

      return { success: true };
    });
  },

  // --- Rescheduling & Credits ---
  async grantCredit(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    data: {
      studentId: string;
      type: typeof studentCredits.type.enumValues[number];
      amount: number;
      expiresAt: Date;
      reason?: string;
    }
  ) {
    if (!hasPermission(user, "credits.grant")) {
      throw new Error("Unauthorized: Only Admin or Manager can grant credits");
    }

    const credit = await schedulingRepository.createCredit({
      ...data,
      grantedBy: user.id,
    });

    // Notification
    await notificationService.sendNotification({
      title: "Crédito Recebido",
      body: `Você recebeu ${data.amount} crédito(s) de ${data.type}.`,
      targetType: "specific",
      userIds: [data.studentId],
      channels: { inApp: true, push: true },
    });

    return credit;
  },

  async rescheduleWithCredit(
    studentId: string,
    originalClassId: string,
    newSlotId: string,
    creditId: string
  ) {
    const credit = await schedulingRepository.findCreditById(creditId);
    if (!credit || credit.studentId !== studentId || credit.usedAt || credit.expiresAt < new Date()) {
      throw new Error("Invalid or expired credit");
    }

    const originalSlot = await schedulingRepository.findById(originalClassId);
    if (!originalSlot || originalSlot.studentId !== studentId) {
      throw new Error("Original class not found or not owned by student");
    }

    const targetSlot = await schedulingRepository.findById(newSlotId);
    if (!targetSlot || targetSlot.status !== "available") {
      throw new Error("Target slot is no longer available");
    }

    return await db.transaction(async (tx) => {
      // 1. Use the credit
      await tx.update(studentCredits)
        .set({ usedAt: new Date(), usedForClassId: newSlotId })
        .where(eq(studentCredits.id, creditId));

      // 2. Update target slot
      await tx.update(slotInstances)
        .set({
          studentId,
          status: "scheduled",
          creditId,
          creditType: credit.type,
          isReschedulable: false, // Prevent infinite loops
          rescheduledFrom: {
            originalClassId,
            originalScheduledAt: originalSlot.startAt,
          },
          updatedAt: new Date(),
        })
        .where(eq(slotInstances.id, newSlotId));

      // Notification to Teacher
      await notificationService.sendNotification({
        title: "Aula Reagendada",
        body: `Um aluno reagendou uma aula para ${format(targetSlot.startAt, "dd/MM HH:mm")}.`,
        targetType: "specific",
        userIds: [targetSlot.teacherId],
        channels: { inApp: true, push: true },
      });

      return { success: true };
    });
  },

  async getStudentCredits(studentId: string, onlyActive: boolean = true) {
    return schedulingRepository.findCreditsByStudent(studentId, onlyActive);
  },

  async convertToAvailable(user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" }, classId: string) {
    const slot = await schedulingRepository.findById(classId);
    if (!slot) throw new Error("Slot not found");

    // Only teacher of the slot or Admin/Manager can convert
    if (!hasPermission(user, "class.update.any") && slot.teacherId !== user.id) {
      throw new Error("Unauthorized: Only the assigned teacher or Admin can convert this slot");
    }

    if (slot.status !== "canceled-student") {
      throw new Error("Only student-canceled classes can be converted into available makeup slots");
    }

    if (slot.convertedToAvailableSlot) {
      throw new Error("Slot already converted");
    }

    return await db.transaction(async (tx) => {
      // 1. Mark original as converted
      await tx.update(slotInstances)
        .set({ convertedToAvailableSlot: true, convertedAt: new Date() })
        .where(eq(slotInstances.id, classId));

      // 2. Create NEW available slot
      await tx.insert(slotInstances).values({
        teacherId: slot.teacherId,
        type: "REPOSICAO",
        status: "available",
        startAt: slot.startAt,
        endAt: slot.endAt,
        ruleId: slot.ruleId, // Keep reference to original rule if applicable
      });

      return { success: true };
    });
  },

  // --- Cron Tasks ---
  async materializeAllRules(weeksAhead: number = 4) {
    const rules = await schedulingRepository.findAllRules();
    let totalGenerated = 0;

    for (const rule of rules) {
      const generated = await this.materializeFutureSlots(rule.id, weeksAhead);
      totalGenerated += generated;
    }

    return totalGenerated;
  },

  async materializeFutureSlots(ruleId: string, weeksAhead: number = 4) {
    const rule = await schedulingRepository.findRuleById(ruleId);
    if (!rule) throw new Error("Rule not found");

    const now = new Date();
    const horizon = addWeeks(now, weeksAhead);
    let current = startOfDay(new Date(rule.startDate));
    let generatedCount = 0;

    // Safety: ensure we don't start too far in the past for recurrence
    // If startDate is old, align 'current' to the first occurrence >= today
    if (isBefore(current, startOfDay(now)) && rule.frequency !== "NONE") {
      while (isBefore(current, startOfDay(now))) {
        if (rule.frequency === "WEEKLY") current = addWeeks(current, 1);
        else if (rule.frequency === "BIWEEKLY") current = addWeeks(current, 2);
        else if (rule.frequency === "MONTHLY") current = addMonths(current, 1);
        else break;
      }
    }

    while (!isAfter(current, horizon)) {
      if (rule.endDate && isAfter(current, rule.endDate)) break;

      // Construct startAt and endAt by combining current date with rule times
      const [startHour, startMin] = rule.startTime.split(":").map(Number);
      const [endHour, endMin] = rule.endTime.split(":").map(Number);

      const startAt = new Date(current);
      startAt.setHours(startHour, startMin, 0, 0);

      const endAt = new Date(current);
      endAt.setHours(endHour, endMin, 0, 0);

      // Final checks
      if (isAfter(startAt, now)) {
        // 1. Check for specific materialized slot
        const exists = await schedulingRepository.findSlotByRuleAndDate(ruleId, startAt);
        
        // 2. Check for ANY overlapping slot for this teacher (Conflict Prevention)
        const conflict = await schedulingRepository.findOverlappingSlot(rule.teacherId, startAt, endAt);

        if (!exists && !conflict) {
          await schedulingRepository.createSlotInstance({
            ruleId: rule.id,
            teacherId: rule.teacherId,
            studentId: rule.studentId, // Inherit current allocation
            type: rule.type,
            status: rule.studentId ? "scheduled" : "available",
            startAt,
            endAt,
          });
          generatedCount++;
        }
      }

      // Advance
      if (rule.frequency === "WEEKLY") current = addWeeks(current, 1);
      else if (rule.frequency === "BIWEEKLY") current = addWeeks(current, 2);
      else if (rule.frequency === "MONTHLY") current = addMonths(current, 1);
      else break; // Frequency NONE or end
    }

    return generatedCount;
  },

  async cleanupExpiredCredits() {
    const now = new Date();
    return await schedulingRepository.expireCredits(now);
  },

  async processOverdueClasses() {
    // Threshold: 2 hours ago
    const threshold = subHours(new Date(), 2);
    const overdueSlots = await schedulingRepository.findOverdueClasses(threshold);

    if (overdueSlots.length === 0) return 0;

    const ids = overdueSlots.map(s => s.id);
    await schedulingRepository.updateStatusBulk(ids, "overdue");

    // Notifications
    for (const slot of overdueSlots) {
      // 1. Notify Managers
      await notificationService.sendNotification({
        title: "Aula não atualizada (Atenção)",
        body: `A aula do prof. ${slot.teacherId} em ${format(slot.startAt, "dd/MM HH:mm")} não foi atualizada e expirou.`,
        targetType: "role",
        targetRole: "manager",
        channels: { inApp: true, push: true },
      });

      // 2. Notify Teacher (InApp/Push/Email)
      const teacher = await userRepository.findById(slot.teacherId);
      if (teacher) {
         await notificationService.sendNotification({
          title: "⚠️ Aula pendente de atualização",
          body: `Sua aula de ${format(slot.startAt, "dd/MM HH:mm")} passou de 2h e não foi atualizada.`,
          targetType: "specific",
          userIds: [slot.teacherId],
          channels: { inApp: true, push: true },
        });

        if (teacher.email) {
            await communicationService.sendClassOverdueTeacherEmail(teacher.email, {
                teacherName: teacher.name || "Professor",
                classDate: format(slot.startAt, "dd/MM/yyyy HH:mm"),
            });
        }
      }
    }

    return overdueSlots.length;
  },

  async sendClassReminders() {
    const now = new Date();
    let totalSent = 0;

    // --- 24h Reminders ---
    const window24hStart = addHours(now, 23);
    const window24hEnd = addHours(now, 25);
    const slots24h = await schedulingRepository.findClassesForReminders("24h", window24hStart, window24hEnd);

    if (slots24h.length > 0) {
      for (const slot of slots24h) {
        if (!slot.studentId) continue;
        
        // Notify Student
        await notificationService.sendNotification({
          title: "Lembrete de Aula (Amanhã)",
          body: `Você tem uma aula marcada para amanhã às ${format(slot.startAt, "HH:mm")}.`,
          targetType: "specific",
          userIds: [slot.studentId],
          channels: { inApp: true, push: true },
        });

        // Notify Teacher
        await notificationService.sendNotification({
          title: "Aula Amanhã",
          body: `Lembrete: Aula com aluno em ${format(slot.startAt, "HH:mm")}.`,
          targetType: "specific",
          userIds: [slot.teacherId],
          channels: { inApp: true, push: true },
        });
      }
      await schedulingRepository.markRemindersAsSent(slots24h.map(s => s.id), "24h");
      totalSent += slots24h.length;
    }

    // --- 1h Reminders ---
    const window1hStart = now;
    const window1hEnd = addMinutes(now, 90);
    const slots1h = await schedulingRepository.findClassesForReminders("1h", window1hStart, window1hEnd);

    if (slots1h.length > 0) {
      for (const slot of slots1h) {
        if (!slot.studentId) continue;

        // Notify Student
        await notificationService.sendNotification({
          title: "Sua aula começa em breve!",
          body: `Sua aula das ${format(slot.startAt, "HH:mm")} começa em aproximadamente 1 hora.`,
          targetType: "specific",
          userIds: [slot.studentId],
          channels: { inApp: true, push: true },
        });

        // Notify Teacher
        await notificationService.sendNotification({
          title: "Aula em 1 hora",
          body: `Sua próxima aula começa às ${format(slot.startAt, "HH:mm")}.`,
          targetType: "specific",
          userIds: [slot.teacherId],
          channels: { inApp: true, push: true },
        });
      }
      await schedulingRepository.markRemindersAsSent(slots1h.map(s => s.id), "1h");
      totalSent += slots1h.length;
    }

    return totalSent;
  }
};

