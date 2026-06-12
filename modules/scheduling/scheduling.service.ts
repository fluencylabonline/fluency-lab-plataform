import { db } from "@/lib/db";
import { schedulingRepository, DbClient } from "./scheduling.repository";
import { hasPermission } from "@/lib/rbac";
import { UserRoleInfo } from "@/lib/rbac";
import {
  slotInstances,
  recurrenceRules,
  studentCredits,
  schedulingAuditLogs,
  recessRequestsTable
} from "./scheduling.schema";
import { usersTable, type User } from "@/modules/user/user.schema";
import { contractInstancesTable } from "@/modules/contract/contract.schema";
import { eq, and, gte, lt, asc, desc, inArray, isNotNull, isNull, between, gt } from "drizzle-orm";
import { communicationService } from "@/modules/communication/communication.service";
import { userService } from "@/modules/user/user.service";
import { env } from "@/env";
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
  addMinutes,
  endOfMonth,
  startOfMonth,
  differenceInCalendarDays
} from "date-fns";
import { notificationService } from "@/modules/notification/notification.service";
import { NewSlotInstance } from "./scheduling.types";
function getLocalDateParts(date: Date, timeZone: string = "America/Sao_Paulo") {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)!.value;
  return {
    year: parseInt(getPart("year")),
    month: parseInt(getPart("month")) - 1, // 0-indexed
    day: parseInt(getPart("day")),
    hour: parseInt(getPart("hour")),
    minute: parseInt(getPart("minute")),
  };
}

function getLocalMidnight(date: Date, timeZone: string = "America/Sao_Paulo"): Date {
  const parts = getLocalDateParts(date, timeZone);
  return localToUtc(parts.year, parts.month, parts.day, 0, 0, timeZone);
}

function localToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string = "America/Sao_Paulo"): Date {
  const utcDate = new Date(Date.UTC(year, month, day, hour, minute, 0));
  const parts = getLocalDateParts(utcDate, timeZone);
  const formattedUtc = Date.UTC(parts.year, parts.month, parts.day, parts.hour, parts.minute, 0);
  const diff = utcDate.getTime() - formattedUtc;
  return new Date(utcDate.getTime() + diff);
}

function isRecessPeriod(date: Date): boolean {
  const parts = getLocalDateParts(date);
  const month = parts.month; // 0 = Jan, 11 = Dez
  const day = parts.day;

  // Dezembro: duas últimas semanas (a partir do dia 18/12)
  if (month === 11 && day >= 18) {
    return true;
  }
  // Janeiro: duas primeiras semanas (até o dia 14/01)
  if (month === 0 && day <= 14) {
    return true;
  }
  return false;
}

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

    // Auto-materialize first 24 weeks (6 months)
    await this.materializeFutureSlots(rule.id, 24);

    return rule;
  },

  // --- Student Allocation ---
  // --- Student Allocation ---
  async allocateStudentToRule(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    ruleId: string,
    studentId: string
  ) {
    // RBAC: Admin/Manager can allocate students.
    if (!hasPermission(user, "class.update.any")) {
      throw new Error("Unauthorized: Only Admin or Manager can allocate students to rules");
    }

    const rule = await schedulingRepository.findRuleById(ruleId);
    if (!rule) throw new Error("Recurrence Rule not found");

    const student = await userService.getUserById(studentId);
    if (!student) throw new Error("Student not found");

    // 1. Get student's active contract to find expiresAt
    const contract = await db.query.contractInstancesTable.findFirst({
      where: and(
        eq(contractInstancesTable.userId, studentId),
        eq(contractInstancesTable.status, "signed")
      ),
      orderBy: [desc(contractInstancesTable.createdAt)]
    });

    if (!contract || !contract.expiresAt) {
      throw new Error("Student has no signed contract with expiration date.");
    }

    // Business Rule: Clamped between 6 and 12 months from now
    const now = new Date();
    const maxHorizon = addMonths(now, 12);
    const minHorizon = addMonths(now, 6);

    let horizon = endOfMonth(contract.expiresAt);
    if (isAfter(horizon, maxHorizon)) horizon = maxHorizon;
    if (isBefore(horizon, minHorizon)) horizon = minHorizon;

    const startAllocationFrom = student.classesStartDate
      ? new Date(student.classesStartDate)
      : now;

    return await db.transaction(async (tx) => {
      // 2. Update the rule template
      await tx.update(recurrenceRules)
        .set({ studentId })
        .where(eq(recurrenceRules.id, ruleId));

      // 3. Update existing available slots up to horizon (only starting from classesStartDate/now)
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
            gte(slotInstances.startAt, startAllocationFrom),
            lt(slotInstances.startAt, horizon)
          )
        );

      // 4. Generate missing slots if teacher schedule doesn't reach horizon
      // We pass studentId to ensure newly created slots are correctly attributed
      await this.materializeSlotsUntilDate(ruleId, horizon, tx, studentId, startAllocationFrom);

      // Notification
      await notificationService.sendNotification({
        title: "Novo Horário Agendado",
        body: `Você foi alocado para um novo horário recorrente iniciando em ${format(startAllocationFrom, "dd/MM")}.`,
        targetType: "specific",
        userIds: [studentId],
        channels: { inApp: true, push: true },
      });

      // Notify Teacher about new student and possible extra slots
      await notificationService.sendNotification({
        title: "Novo Aluno Alocado",
        body: `O aluno ${student.name || ""} foi alocado no seu horário de ${rule.startTime}. Aulas geradas até ${format(horizon, "dd/MM/yyyy")}.`,
        targetType: "specific",
        userIds: [rule.teacherId],
        channels: { inApp: true, push: true },
      });

      return { success: true };
    });
  },

  async deallocateStudentFromRule(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    ruleId: string
  ) {
    if (!hasPermission(user, "class.update.any")) {
      throw new Error("Unauthorized: Only Admin or Manager can deallocate students");
    }

    const now = new Date();

    return await db.transaction(async (tx) => {
      // 1. Remove student from rule
      await tx.update(recurrenceRules)
        .set({ studentId: null })
        .where(eq(recurrenceRules.id, ruleId));

      // 2. Revert future slots to available
      await tx.update(slotInstances)
        .set({
          studentId: null,
          status: "available",
          updatedAt: now
        })
        .where(
          and(
            eq(slotInstances.ruleId, ruleId),
            eq(slotInstances.status, "scheduled"),
            gte(slotInstances.startAt, now)
          )
        );

      return { success: true };
    });
  },

  async materializeSlotsUntilDate(
    ruleId: string,
    horizon: Date,
    tx?: DbClient,
    overrideStudentId?: string,
    startAllocationFrom?: Date
  ) {
    const dbClient = tx || db;
    const rule = await schedulingRepository.findRuleById(ruleId, dbClient);
    if (!rule) throw new Error("Rule not found");

    const now = new Date();
    const alignThreshold = startAllocationFrom ? getLocalMidnight(startAllocationFrom) : getLocalMidnight(now);
    let current = getLocalMidnight(new Date(rule.startDate));
    let generatedCount = 0;

    if (isBefore(current, alignThreshold) && rule.frequency !== "NONE") {
      while (isBefore(current, alignThreshold)) {
        if (rule.frequency === "WEEKLY") current = addWeeks(current, 1);
        else if (rule.frequency === "BIWEEKLY") current = addWeeks(current, 2);
        else if (rule.frequency === "MONTHLY") current = addMonths(current, 1);
        else break;
      }
    }

    const startGenerationThreshold = startAllocationFrom || now;

    while (!isAfter(current, horizon)) {
      const [startHour, startMin] = rule.startTime.split(":").map(Number);
      const [endHour, endMin] = rule.endTime.split(":").map(Number);

      const parts = getLocalDateParts(current);
      const startAt = localToUtc(parts.year, parts.month, parts.day, startHour, startMin);
      const endAt = localToUtc(parts.year, parts.month, parts.day, endHour, endMin);

      if (!isBefore(startAt, startGenerationThreshold)) {
        if (!isRecessPeriod(startAt)) {
          const exists = await schedulingRepository.findSlotByRuleAndDate(ruleId, startAt, dbClient);
          const conflict = await schedulingRepository.findOverlappingSlot(rule.teacherId, startAt, endAt, undefined, dbClient);

          if (!exists && !conflict) {
            const shouldAssignStudent = overrideStudentId && (!startAllocationFrom || !isBefore(startAt, startAllocationFrom));

            await schedulingRepository.createSlotInstance({
              ruleId: rule.id,
              teacherId: rule.teacherId,
              studentId: shouldAssignStudent ? overrideStudentId : null,
              type: rule.type,
              status: shouldAssignStudent ? "scheduled" : "available",
              startAt,
              endAt,
            });
            generatedCount++;
          }
        }
      }

      if (rule.frequency === "WEEKLY") current = addWeeks(current, 1);
      else if (rule.frequency === "BIWEEKLY") current = addWeeks(current, 2);
      else if (rule.frequency === "MONTHLY") current = addMonths(current, 1);
      else break;
    }
    return generatedCount;
  },


  async swapSlotTeacher(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    slotId: string,
    newTeacherId: string
  ) {
    if (!hasPermission(user, "class.update.any")) {
      throw new Error("Unauthorized: Only Admin or Manager can swap teachers.");
    }

    const slot = await schedulingRepository.findById(slotId);
    if (!slot) throw new Error("Slot not found");
    if (!slot.studentId) throw new Error("Slot must have a student to be swapped.");

    // Check conflict for new teacher
    const conflict = await schedulingRepository.findOverlappingSlot(newTeacherId, slot.startAt, slot.endAt);
    if (conflict && conflict.status !== "available" && conflict.status !== "canceled-teacher" && conflict.status !== "canceled-admin") {
      throw new Error(`Conflict: New teacher already has a class at ${format(slot.startAt, "HH:mm")}`);
    }

    const swapResult = await db.transaction(async (tx) => {
      // 1. Mark old slot as canceled-admin
      await tx.update(slotInstances)
        .set({ status: "canceled-admin", updatedAt: new Date() })
        .where(eq(slotInstances.id, slotId));

      // 2. If new teacher has an 'available' slot here, use it. Otherwise create new.
      if (conflict && conflict.status === "available") {
        await tx.update(slotInstances)
          .set({
            studentId: slot.studentId,
            status: "scheduled",
            planId: slot.planId,
            planName: slot.planName,
            lessonId: slot.lessonId,
            lessonTitle: slot.lessonTitle,
            updatedAt: new Date()
          })
          .where(eq(slotInstances.id, conflict.id));
      } else {
        await tx.insert(slotInstances).values({
          teacherId: newTeacherId,
          studentId: slot.studentId,
          status: "scheduled",
          type: slot.type,
          startAt: slot.startAt,
          endAt: slot.endAt,
          planId: slot.planId,
          planName: slot.planName,
          lessonId: slot.lessonId,
          lessonTitle: slot.lessonTitle,
        });
      }

      // Audit log for swap
      await tx.insert(schedulingAuditLogs).values({
        slotId,
        actorId: user.id,
        actorRole: user.role,
        previousStatus: slot.status,
        newStatus: "canceled-admin",
        reason: `Teacher swapped from ${slot.teacherId} to ${newTeacherId}`,
      });

      return { success: true };
    });

    if (swapResult.success) {
      schedulingService.notifySwap(slot.teacherId, newTeacherId, slot.studentId, slot.startAt).catch(console.error);
    }

    return swapResult;
  },

  async notifySwap(oldTeacherId: string, newTeacherId: string, studentId: string | null, startAt: Date) {
    if (!studentId) return;

    const [oldTeacher, newTeacher, student] = await Promise.all([
      userService.getUser(oldTeacherId),
      userService.getUser(newTeacherId),
      userService.getUser(studentId),
    ]);

    const dateStr = format(new Date(startAt), "dd/MM HH:mm");

    if (oldTeacher && student) {
      await communicationService.sendScheduleAlertEmail(
        oldTeacher.email,
        oldTeacher.name,
        `A aula do dia ${dateStr} com o aluno ${student.name} foi removida da sua agenda por um administrador.`
      );
    }

    if (newTeacher && student) {
      await communicationService.sendScheduleAlertEmail(
        newTeacher.email,
        newTeacher.name,
        `Uma nova aula foi atribuída a você no dia ${dateStr} com o aluno ${student.name}.`
      );
    }
  },

  async updateSlotLesson(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    slotId: string,
    lessonId: string,
    lessonTitle: string
  ) {
    if (!hasPermission(user, "class.update.any") && user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    await db.update(slotInstances)
      .set({ lessonId, lessonTitle, updatedAt: new Date() })
      .where(eq(slotInstances.id, slotId));

    return { success: true };
  },

  // --- Class Status Management ---
  async updateClassStatus(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    classId: string,
    status: typeof slotInstances.status.enumValues[number]
  ) {
    // RBAC: Admin/Manager can change to any status.
    const isAdmin = hasPermission(user, "class.update.any");
    const slot = await schedulingRepository.findById(classId);
    if (!slot) throw new Error("Slot instance not found");

    if (!isAdmin) {
      // Teacher limits
      if (user.role === "teacher" && slot.teacherId === user.id) {
        const allowedTeacherStatus = ["completed", "canceled-teacher", "no-show"];
        if (!allowedTeacherStatus.includes(status)) {
          throw new Error("Unauthorized: Teachers can only set completed, canceled-teacher or no-show.");
        }
      } else {
        throw new Error("Unauthorized to change status of this class.");
      }
    }

    const updateData: Partial<NewSlotInstance> = { status };
    if (status === "completed" || status === "no-show") {
      const teacher = await userService.getUserById(slot.teacherId);
      if (teacher) {
        updateData.teacherHourlyRate = teacher.teacherHourlyRate;
      }
    }

    await schedulingRepository.updateSlot(classId, updateData);

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

      const updateData: Partial<NewSlotInstance> = { status: finalStatus, updatedAt: new Date() };
      if (finalStatus === "completed" || finalStatus === "no-show") {
        const teacher = await userService.getUserById(slot.teacherId);
        if (teacher) {
          updateData.teacherHourlyRate = teacher.teacherHourlyRate;
        }
      }

      // 2. Update slot status
      await tx.update(slotInstances)
        .set(updateData)
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


      // 3. If canceled-teacher AND met the notice period (if applicable)
      if (reason === "canceled-teacher" && slot.studentId) {
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

          // Special notification for teacher with conversion link if student canceled
          if (reason === "canceled-student") {
            const [teacher, student] = await Promise.all([
              userService.getUserById(slot.teacherId),
              userService.getUserById(slot.studentId!),
            ]);

            if (teacher && student) {
              const convertLink = `${env.NEXT_PUBLIC_APP_URL}/convert-class/${slot.id}`;
              
              // Push/In-app notification with link
              await notificationService.sendNotification({
                title: "\u26A0\uFE0F Aula Cancelada: Converter em Dispon\u00EDvel?",
                body: `O aluno ${student.name} cancelou a aula de ${format(slot.startAt, "dd/MM HH:mm")}. Clique aqui para converter esse hor\u00E1rio em uma aula de reposi\u00E7\u00E3o dispon\u00EDvel.`,
                targetType: "specific",
                userIds: [slot.teacherId],
                actionUrl: convertLink,
                channels: { inApp: true, push: true },
              });

              // Email notification with link
              await communicationService.sendClassCancelledWithConvertEmail(teacher.email, {
                teacherName: teacher.name,
                studentName: student.name,
                classDate: format(slot.startAt, "dd/MM/yyyy"),
                classTime: format(slot.startAt, "HH:mm"),
                convertUrl: convertLink
              });
            }
          }
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
    return await db.transaction(async (tx) => {
      // 1. Atomically consume the credit and check if it was actually available
      const [updatedCredit] = await tx.update(studentCredits)
        .set({ 
          usedAt: new Date(), 
          usedForClassId: newSlotId,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(studentCredits.id, creditId),
            eq(studentCredits.studentId, studentId),
            isNull(studentCredits.usedAt),
            gt(studentCredits.expiresAt, new Date())
          )
        )
        .returning();

      if (!updatedCredit) {
        throw new Error("Crédito inválido, já utilizado ou expirado.");
      }

      const originalSlot = await schedulingRepository.findById(originalClassId);
      if (!originalSlot || originalSlot.studentId !== studentId) {
        throw new Error("Aula original não encontrada ou não pertence ao aluno.");
      }

      const targetSlot = await schedulingRepository.findById(newSlotId);
      if (!targetSlot || targetSlot.status !== "available") {
        throw new Error("O horário de destino não está mais disponível.");
      }

      // 2. Update target slot
      await tx.update(slotInstances)
        .set({
          studentId,
          status: "scheduled",
          creditId,
          creditType: updatedCredit.type,
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

  async deleteSlot(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    slotId: string,
    scope: "single" | "future"
  ) {
    const slot = await schedulingRepository.findById(slotId);
    if (!slot) throw new Error("Slot not found");

    // ABAC Check: Admin/Manager or the assigned teacher
    const isAdmin = hasPermission(user, "class.update.any");
    const isTeacher = user.role === "teacher" && slot.teacherId === user.id;

    if (!isAdmin && !isTeacher) {
      throw new Error("Unauthorized to delete this slot");
    }

    return await db.transaction(async (tx) => {
      if (scope === "single") {
        await tx.delete(slotInstances).where(eq(slotInstances.id, slotId));
      } else if (scope === "future" && slot.ruleId) {
        // Delete this and all future materialized slots
        await tx.delete(slotInstances)
          .where(
            and(
              eq(slotInstances.ruleId, slot.ruleId),
              gte(slotInstances.startAt, slot.startAt)
            )
          );

        // Update the recurrence rule to end it
        await tx.update(recurrenceRules)
          .set({ endDate: slot.startAt })
          .where(eq(recurrenceRules.id, slot.ruleId));
      }

      return { success: true };
    });
  },

  async updateSlot(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    slotId: string,
    data: Partial<typeof slotInstances.$inferInsert>,
    scope: "single" | "future"
  ) {
    const slot = await schedulingRepository.findById(slotId);
    if (!slot) throw new Error("Slot not found");

    // ABAC Check
    const isAdmin = hasPermission(user, "class.update.any");
    const isTeacher = user.role === "teacher" && slot.teacherId === user.id;

    if (!isAdmin && !isTeacher) {
      throw new Error("Unauthorized to update this slot");
    }

    return await db.transaction(async (tx) => {
      // 1. Time Validation
      if (data.startAt && data.endAt) {
        const start = new Date(data.startAt);
        const end = new Date(data.endAt);
        if (isBefore(end, start) || start.getTime() === end.getTime()) {
          throw new Error("Invalid interval: End time must be after start time");
        }
      }

      // 2. Conflict Detection (Teacher Overlap)
      if (data.startAt || data.endAt) {
        const checkStart = data.startAt ? new Date(data.startAt) : slot.startAt;
        const checkEnd = data.endAt ? new Date(data.endAt) : slot.endAt;

        if (scope === "single") {
          const conflict = await schedulingRepository.findOverlappingSlot(slot.teacherId, checkStart, checkEnd, slotId);
          if (conflict) {
            throw new Error(`Conflict detected: Teacher already has a slot at this time (${format(conflict.startAt, "HH:mm")} - ${format(conflict.endAt, "HH:mm")})`);
          }
        } else if (scope === "future" && slot.ruleId) {
          // For future, we'd need a more complex check or a warning. 
          // For now, let's at least check the current slot's future time.
          const conflict = await schedulingRepository.findOverlappingSlot(slot.teacherId, checkStart, checkEnd, slotId);
          if (conflict) {
            throw new Error(`Conflict detected in this slot: Teacher already has a slot at this time (${format(conflict.startAt, "HH:mm")} - ${format(conflict.endAt, "HH:mm")})`);
          }
        }
      }

      if (scope === "single") {
        await tx.update(slotInstances)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(slotInstances.id, slotId));
      } else if (scope === "future" && slot.ruleId) {
        // Fetch this and all future materialized slots
        const futureSlots = await tx.select()
          .from(slotInstances)
          .where(
            and(
              eq(slotInstances.ruleId, slot.ruleId),
              gte(slotInstances.startAt, slot.startAt)
            )
          );

        let targetStartHour = 0;
        let targetStartMin = 0;
        let targetEndHour = 0;
        let targetEndMin = 0;
        let timeChanged = false;

        if (data.startAt && data.endAt) {
          const newStartLocal = getLocalDateParts(new Date(data.startAt));
          targetStartHour = newStartLocal.hour;
          targetStartMin = newStartLocal.minute;

          const newEndLocal = getLocalDateParts(new Date(data.endAt));
          targetEndHour = newEndLocal.hour;
          targetEndMin = newEndLocal.minute;

          timeChanged = true;
        }

        for (const futureSlot of futureSlots) {
          const updateObj: Partial<typeof slotInstances.$inferInsert> = {
            ...data,
            updatedAt: new Date(),
          };

          if (timeChanged) {
            const originalStartParts = getLocalDateParts(futureSlot.startAt);
            const originalEndParts = getLocalDateParts(futureSlot.endAt);

            updateObj.startAt = localToUtc(
              originalStartParts.year,
              originalStartParts.month,
              originalStartParts.day,
              targetStartHour,
              targetStartMin
            );

            updateObj.endAt = localToUtc(
              originalEndParts.year,
              originalEndParts.month,
              originalEndParts.day,
              targetEndHour,
              targetEndMin
            );
          }

          await tx.update(slotInstances)
            .set(updateObj)
            .where(eq(slotInstances.id, futureSlot.id));
        }

        // Synchronize rule template if time or basic metadata changed
        const ruleUpdate: Partial<typeof recurrenceRules.$inferSelect> = {};
        if (data.startAt) ruleUpdate.startTime = format(new Date(data.startAt), "HH:mm");
        if (data.endAt) ruleUpdate.endTime = format(new Date(data.endAt), "HH:mm");

        if (Object.keys(ruleUpdate).length > 0) {
          await tx.update(recurrenceRules)
            .set(ruleUpdate)
            .where(eq(recurrenceRules.id, slot.ruleId));
        }
      }

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
    const localMidnightOfToday = getLocalMidnight(now);
    let current = getLocalMidnight(new Date(rule.startDate));
    let generatedCount = 0;

    // Safety: ensure we don't start too far in the past for recurrence
    // If startDate is old, align 'current' to the first occurrence >= today
    if (isBefore(current, localMidnightOfToday) && rule.frequency !== "NONE") {
      while (isBefore(current, localMidnightOfToday)) {
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

      const parts = getLocalDateParts(current);
      const startAt = localToUtc(parts.year, parts.month, parts.day, startHour, startMin);
      const endAt = localToUtc(parts.year, parts.month, parts.day, endHour, endMin);

      // Final checks
      if (isAfter(startAt, now)) {
        if (!isRecessPeriod(startAt)) {
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
      const teacher = await userService.getUserById(slot.teacherId);
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
  },
  async getTeacherCompletedClasses(teacherId: string, start: Date, end: Date) {
    return schedulingRepository.findCompletedByTeacherInRange(teacherId, start, end);
  },
  async findByStudentAndTeacherInRange(studentId: string, teacherId: string, start: Date, end: Date) {
    return schedulingRepository.findByStudentAndTeacherInRange(studentId, teacherId, start, end);
  },

  async getTeacherDailySummary(teacherId: string) {
    const today = new Date();
    const start = startOfDay(today);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    return schedulingRepository.findByTeacherInRange(teacherId, start, end);
  },

  async getTeacherClassesInRange(teacherId: string, start: Date, end: Date) {
    return schedulingRepository.findByTeacherInRange(teacherId, start, end);
  },
  async getStudentClassesInRange(studentId: string, start: Date, end: Date) {
    return db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.studentId, studentId),
        gte(slotInstances.startAt, start),
        lt(slotInstances.startAt, end)
      ),
      orderBy: [asc(slotInstances.startAt)],
    });
  },

  async cancelFutureClassesForStudent(studentId: string) {
    const now = new Date();
    
    // 1. Get all future scheduled classes for this student
    const futureClasses = await db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.studentId, studentId),
        eq(slotInstances.status, "scheduled"),
        gte(slotInstances.startAt, now)
      ),
      orderBy: [slotInstances.startAt]
    });

    if (futureClasses.length === 0) return { success: true, count: 0 };

    const student = await userService.getUser(studentId);
    const teacherIds = Array.from(new Set(futureClasses.map(c => c.teacherId)));

    return await db.transaction(async (tx) => {
      // 2. Mark future classes as canceled-admin
      await tx.update(slotInstances)
        .set({ status: "canceled-admin", updatedAt: now })
        .where(
          and(
            eq(slotInstances.studentId, studentId),
            eq(slotInstances.status, "scheduled"),
            gte(slotInstances.startAt, now)
          )
        );

      // 3. Clear student from recurrence rules to prevent cron job from generating new classes for them
      await tx.update(recurrenceRules)
        .set({ studentId: null, updatedAt: now })
        .where(eq(recurrenceRules.studentId, studentId));

      // 4. Create new AVAILABLE slots for each canceled class
      for (const cls of futureClasses) {
        await tx.insert(slotInstances).values({
          teacherId: cls.teacherId,
          ruleId: cls.ruleId,
          type: cls.type,
          status: "available",
          startAt: cls.startAt,
          endAt: cls.endAt,
          updatedAt: now
        });
      }

      // 4. Notify each teacher about the cancellation and new availability
      for (const teacherId of teacherIds) {
        const teacher = await userService.getUser(teacherId);
        if (teacher && student) {
          const teacherClasses = futureClasses.filter(c => c.teacherId === teacherId);
          const firstClass = teacherClasses[0].startAt;
          const lastClass = teacherClasses[teacherClasses.length - 1].startAt;
          
          await communicationService.sendScheduleAlertEmail(
            teacher.email,
            teacher.name,
            `O aluno ${student.name} encerrou o contrato e não fará mais aulas. ${teacherClasses.length} aulas foram canceladas no período de ${format(firstClass, "dd/MM")} a ${format(lastClass, "dd/MM")}. Novos horários vagos foram abertos em sua agenda automaticamente.`
          );
        }
      }

      return { success: true, count: futureClasses.length };
    });
  },

  async getRecessImpact(teacherId: string, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const classes = await schedulingRepository.findByTeacherInRange(teacherId, start, end);
    const scheduledClasses = classes.filter(cls => cls.status === "scheduled" && cls.studentId);
    
    const studentsAffected = new Map<string, { id: string; name: string; language: string; classesCount: number }>();
    const affectedClasses = scheduledClasses.map(cls => ({
      id: cls.id,
      studentId: cls.studentId!,
      studentName: cls.student?.name || "Aluno",
      startAt: cls.startAt,
      endAt: cls.endAt,
      language: "English" // Placeholder
    }));

    scheduledClasses.forEach(cls => {
      if (cls.studentId && cls.student) {
        const existing = studentsAffected.get(cls.studentId);
        if (existing) {
          existing.classesCount++;
        } else {
          studentsAffected.set(cls.studentId, {
            id: cls.studentId,
            name: cls.student.name || "Aluno",
            language: "English", // Placeholder
            classesCount: 1
          });
        }
      }
    });

    return {
      totalClasses: scheduledClasses.length,
      totalStudents: studentsAffected.size,
      studentsAffected: Array.from(studentsAffected.values()),
      affectedClasses
    };
  },

  async validateRecessSLA(teacherId: string, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    // 1. Check for Overlaps
    const existingRecesses = await schedulingRepository.findRecessesByTeacher(teacherId);
    const hasOverlap = existingRecesses.some(r => {
      return (start <= r.endDate && end >= r.startDate);
    });

    if (hasOverlap) {
      return {
        success: false,
        error: "Você já possui um recesso agendado que sobrepõe este período."
      };
    }

    const daysAdvance = differenceInCalendarDays(start, now);
    const duration = differenceInCalendarDays(end, start);
    
    return {
      success: true,
      data: {
        isAutomatic: daysAdvance >= 20 && duration <= 15,
        daysAdvance,
        duration,
        requiresReview: daysAdvance < 20
      }
    };
  },

  async getTeacherRecesses(teacherId: string) {
    return await schedulingRepository.findRecessesByTeacher(teacherId);
  },

  async registerRecess(
    user: User, 
    data: { startDate: Date; endDate: Date; fallbackConfig: Record<string, { lessonId: string; message?: string }> }
  ) {
    const { startDate, endDate, fallbackConfig } = data;
    
    // Re-validate overlap at registration
    const existingRecesses = await schedulingRepository.findRecessesByTeacher(user.id);
    const hasOverlap = existingRecesses.some(r => {
      return (startDate <= r.endDate && endDate >= r.startDate);
    });

    if (hasOverlap) throw new Error("Período de recesso sobreposto detectado.");

    const now = new Date();
    const daysAdvance = differenceInCalendarDays(startDate, now);
    const isAutomatic = daysAdvance >= 20;

    return await db.transaction(async (tx) => {
      // 1. Create Recess Request
      const [request] = await tx.insert(recessRequestsTable).values({
        teacherId: user.id,
        startDate,
        endDate,
        isValidated: isAutomatic,
        fallbackConfig,
      }).returning();

      // 2. Get affected classes
      const affectedClasses = await schedulingRepository.findByTeacherInRange(user.id, startDate, endDate);

      for (const cls of affectedClasses) {
        if (!cls.studentId) continue;
        
        const config = fallbackConfig[cls.id];
        
        // 3. Clone current class as fallback
        await tx.insert(slotInstances).values({
          teacherId: cls.teacherId,
          studentId: cls.studentId,
          ruleId: cls.ruleId,
          startAt: cls.startAt,
          endAt: cls.endAt,
          status: "scheduled",
          type: "RECESS_FALLBACK",
          lessonId: config?.lessonId,
          notes: `Atividade de recesso: ${config?.message || ""}`,
        });

        // 4. Mark original class as 'teacher-recess'
        await tx.update(slotInstances)
          .set({ 
            status: "teacher-recess",
            updatedAt: new Date()
          })
          .where(eq(slotInstances.id, cls.id));
      }

      // 5. Notify Managers
      await notificationService.sendNotification({
        title: isAutomatic ? "Novo Recesso Agendado" : "Nova Solicitação de Recesso (Revisão)",
        body: `O professor ${user.name} agendou recesso de ${format(startDate, "dd/MM")} a ${format(endDate, "dd/MM")}.`,
        targetType: "role",
        targetRole: "manager",
        channels: { inApp: true },
      });

      return request;
    });
  },

  async getTeacherClasses(teacherId: string, startDate: Date, endDate: Date) {
    return await schedulingRepository.findByTeacherInRange(teacherId, startDate, endDate);
  },

  async getTeacherStudents(teacherId: string) {
    const studentIds = await schedulingRepository.findUniqueStudentsByTeacher(teacherId);
    if (studentIds.length === 0) return [];

    const students = await db.query.usersTable.findMany({
      where: and(
        inArray(usersTable.id, studentIds),
        eq(usersTable.isActive, true)
      ),
    });

    const enrichedStudents = await Promise.all(students.map(async (student) => {
      const nextClass = await schedulingRepository.findNextClassForStudent(student.id, teacherId);
      
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        photoUrl: student.photoUrl,
        nextClass: nextClass ? {
          startAt: nextClass.startAt,
          type: nextClass.type
        } : null
      };
    }));

    return enrichedStudents;
  },

  async getStudentClassesByTeacher(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    studentId: string,
    startDate: Date,
    endDate: Date
  ) {
    // RBAC: Admin/Manager can see any student's classes. Teacher can only see if they teach the student.
    const isAdmin = hasPermission(user, "class.update.any");
    const isTeacher = user.role === "teacher";

    if (!isAdmin && !isTeacher) {
      throw new Error("Unauthorized to access student classes");
    }

    // The repository method filters by both studentId and teacherId (passed as user.id here)
    // If it's an admin, they might want to see classes with a specific teacher? 
    // The prompt implies the teacher is looking at THEIR classes with the student.
    return await schedulingRepository.findByStudentAndTeacherInRange(studentId, user.id, startDate, endDate);
  },

  async updateClassNotes(
    user: { id: string; role: UserRoleInfo["role"] | "admin" | "manager" },
    classId: string,
    notes: string
  ) {
    const slot = await schedulingRepository.findById(classId);
    if (!slot) throw new Error("Slot not found");

    const isAdmin = hasPermission(user, "class.update.any");
    const isTeacher = user.role === "teacher" && slot.teacherId === user.id;

    if (!isAdmin && !isTeacher) {
      throw new Error("Unauthorized to update notes for this class");
    }

    await db.update(slotInstances)
      .set({ notes, updatedAt: new Date() })
      .where(eq(slotInstances.id, classId));

    return { success: true };
  },


  async getStudentCreditBalance(studentId: string) {
    const credits = await schedulingRepository.findCreditsByStudent(studentId, true);
    
    const summary = {
      bonus: 0,
      "late-students": 0,
      "teacher-cancellation": 0,
      total: 0,
    };

    credits.forEach(c => {
      summary[c.type] += c.amount;
      summary.total += c.amount;
    });

    return summary;
  },

  async getStudentRescheduleStats(studentId: string, month: number, year: number) {
    const start = startOfMonth(new Date(year, month, 1));
    const end = endOfMonth(new Date(year, month, 1));

    const reschedules = await db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.studentId, studentId),
        isNotNull(slotInstances.rescheduledFrom),
        between(slotInstances.startAt, start, end)
      )
    });

    return {
      count: reschedules.length,
      limit: 2, // Hardcoded as per user confirmation
      month: format(start, "MM/yyyy"),
    };
  },

  async getTeacherAvailableSlots(teacherId: string, start: Date, end: Date) {
    return await schedulingRepository.findTeacherAvailableSlotsInRange(teacherId, start, end);
  },

  async rescheduleClass(
    studentId: string,
    originalClassId: string,
    newSlotId: string,
    creditId?: string
  ) {
    const originalSlot = await schedulingRepository.findById(originalClassId);
    if (!originalSlot || originalSlot.studentId !== studentId) {
      throw new Error("Original class not found or not owned by student");
    }

    const targetSlot = await schedulingRepository.findById(newSlotId);
    if (!targetSlot || targetSlot.status !== "available") {
      throw new Error("Target slot is no longer available");
    }

    let creditToUse = null;

    if (creditId) {
      creditToUse = await schedulingRepository.findCreditById(creditId);
      if (!creditToUse || creditToUse.studentId !== studentId || creditToUse.usedAt || creditToUse.expiresAt < new Date()) {
        throw new Error("Invalid or expired credit");
      }
    } else {
      // Check Monthly Quota
      const now = new Date();
      const stats = await this.getStudentRescheduleStats(studentId, now.getMonth(), now.getFullYear());
      if (stats.count >= stats.limit) {
        throw new Error("Monthly reschedule quota exceeded. Please use a credit.");
      }
    }

    return await db.transaction(async (tx) => {
      // 1. If using a credit, mark it as used
      if (creditToUse && creditId) {
        await tx.update(studentCredits)
          .set({ usedAt: new Date(), usedForClassId: newSlotId })
          .where(eq(studentCredits.id, creditId));
      }

      // 2. If original is still scheduled, cancel it
      if (originalSlot.status === "scheduled") {
        await tx.update(slotInstances)
          .set({ status: "canceled-student", updatedAt: new Date() })
          .where(eq(slotInstances.id, originalClassId));
        
        await tx.insert(schedulingAuditLogs).values({
          slotId: originalClassId,
          actorId: studentId,
          actorRole: "student",
          previousStatus: "scheduled",
          newStatus: "canceled-student",
          reason: "Rescheduled by student",
        });
      }

      // 3. Update target slot
      await tx.update(slotInstances)
        .set({
          studentId,
          status: "scheduled",
          creditId: creditId || null,
          creditType: creditToUse?.type || null,
          isReschedulable: false,
          rescheduledFrom: {
            originalClassId,
            originalScheduledAt: originalSlot.startAt,
          },
          updatedAt: new Date(),
        })
        .where(eq(slotInstances.id, newSlotId));

      // 4. Notify Teacher
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

  async getCompletedClassesForStudent(studentId: string) {
    return schedulingRepository.findCompletedByStudent(studentId);
  },

  async findNextClassForStudent(studentId: string) {
    return schedulingRepository.findNextClassForStudent(studentId);
  },
};


