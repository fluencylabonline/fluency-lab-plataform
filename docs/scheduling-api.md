# Scheduling API Documentation

This document describes the backend primitives, services, and actions for the Scheduling System. Use this as a reference when implementing the Hub UI.

## 1. Domain Models

### Slot Instances (`slot_instances`)
The actual class event.
- **Status**: `available`, `scheduled`, `completed`, `canceled-student`, `canceled-teacher`, `canceled-teacher-makeup`, `no-show`, `overdue`.
- **`isReschedulable`**: Boolean. If `false`, this class cannot be rescheduled if canceled (typically applies to makeup classes).
- **`rescheduledFrom`**: JSONB field tracking the original class ID and time if this is a makeup class.

### Student Credits (`student_credits`)
Economy used for makeup classes.
- **Granted By**: Admin, Teacher, or System.
- **Expiry**: Automated daily cleanup of expired credits via Cron.

---

## 2. Server Actions (Use in Client Components)

Available in `@/modules/scheduling/scheduling.actions.ts`.

### `createRecurrenceRuleAction(data)`
- **Who can use**: Admin/Manager.
- **Behavior**: Creates a new recurring schedule template and **immediately materializes** the first 4 weeks of slots.
- **Conflict Prevention**: If the teacher already has an overlapping slot (even if canceled/available) at the same time, the system will skip generation for that specific date to prevent double-booking.

### `cancelClassAction({ classId, reason })`
- **Who can use**: Student (own class), Teacher (assigned class), Admin/Manager (any).
- **Notice Period (4h)**: For **students**, if the cancellation occurs with less than 4 hours of notice, the status is forced to `no-show` (no makeup credit granted).
- **Credit Logic**: If a teacher cancels with `canceled-teacher-makeup`, 1 credit is auto-granted to the student.

### `rescheduleWithCreditAction({ originalClassId, newSlotId, creditId })`
- **Who can use**: Student.
- **Rules**: 
    - Verified credit must belong to student, not used, and not expired.
    - `newSlotId` must have status `available`.
    - New slot is marked `isReschedulable: false`.

### `allocateStudentAction({ ruleId, studentId })`
- **Who can use**: Admin/Manager.
- **Behavior**: Sets the student for a recurrence rule and captures all **future** `available` slots from that rule, marking them as `scheduled` for that student.

### `grantCreditAction({ studentId, type, amount, expiresAt, reason })`
- **Who can use**: Admin/Manager.
- **Behavior**: Manually issue credits to a student.

---

## 3. Automated Logic (Cron & Background)

### `POST /api/cron/scheduling`
Requires `Authorization: Bearer CRON_SECRET`.
1.  **Credit Cleanup**: Expires credits where `expiresAt < now`.
2.  **Materialization**: Generates slots for the next 4 weeks for all active rules (with conflict checks).
3.  **Auto-Overdue (2h)**: Any class in `scheduled` status more than **2 hours** after its start time is marked as `overdue`.
    - **Notifications**: Triggers Manager alerts and a warning Email to the Teacher.

---

## 4. UI Implementation Patterns (Recommendations)

### Cancellation Flow
1. User clicks "Cancel".
2. Open a **Vault** with reason options.
3. Call `cancelClassAction`.
4. If notice is < 4h, show a specific warning about the `no-show` result.

### Rescheduling Flow
1. Student views "Available Positions" (slots with `status: available`).
2. Student selects an available credit.
3. Call `rescheduleWithCreditAction`.
