import { 
  usersTable 
} from "@/modules/user/user.schema";
import { 
  recurrenceRules, 
  studentCredits, 
  slotInstances,
  rescheduleWithCreditSchema,
  cancelClassSchema,
  allocateStudentSchema,
  updateSlotStatusSchema,
  grantCreditSchema,
  schedulingAuditLogs,
  recessRequestsTable
} from "./scheduling.schema";
import { z } from "zod";

export type RecurrenceRule = typeof recurrenceRules.$inferSelect;
export type NewRecurrenceRule = typeof recurrenceRules.$inferInsert;

export type StudentCredit = typeof studentCredits.$inferSelect;
export type NewStudentCredit = typeof studentCredits.$inferInsert;

export type SlotInstance = typeof slotInstances.$inferSelect;
export type NewSlotInstance = typeof slotInstances.$inferInsert;

export type SchedulingAuditLog = typeof schedulingAuditLogs.$inferSelect;
export type NewSchedulingAuditLog = typeof schedulingAuditLogs.$inferInsert;

export type RecessRequest = typeof recessRequestsTable.$inferSelect;
export type NewRecessRequest = typeof recessRequestsTable.$inferInsert;


export type UserProfile = typeof usersTable.$inferSelect;

// DTO Types (using z.input to support .default() and optional fields in forms)
export type RescheduleWithCreditValues = z.input<typeof rescheduleWithCreditSchema>;
export type CancelClassValues = z.input<typeof cancelClassSchema>;
export type AllocateStudentValues = z.input<typeof allocateStudentSchema>;
export type UpdateSlotStatusValues = z.input<typeof updateSlotStatusSchema>;
export type GrantCreditValues = z.input<typeof grantCreditSchema>;

// Complex return types
export type StudentCreditWithDetails = StudentCredit & {
  class?: SlotInstance | null;
};

export type SlotInstanceWithDetails = SlotInstance & {
  rule?: RecurrenceRule | null;
  credit?: StudentCredit | null;
  student?: { 
    name: string | null; 
    assignedPlanId: string | null; 
    isActive: boolean;
  } | null;
  teacher?: {
    name: string | null;
  } | null;
  payout?: {
    id: string;
    amount: number;
    month: number;
    year: number;
    status: "pending" | "completed" | "failed";
    createdAt: Date;
    receiptUrl?: string | null;
    invoiceUrl?: string | null;
  } | null;
  // Compatibility fields often attached in services or expected by legacy UI
  teacherName?: string | null;
};

export type ScheduledClass = SlotInstance & {
  rule?: RecurrenceRule | null;
  teacher?: {
    name: string | null;
  } | null;
};
