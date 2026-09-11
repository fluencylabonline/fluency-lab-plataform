import { parseISO } from "date-fns";
import type { SlotInstanceWithDetails } from "@/modules/scheduling/scheduling.types";
import type { CallSession } from "@/modules/call/call.schema";
import type { SlotWithCallSession } from "./CurriculumMonthView";

/**
 * There is no direct foreign key between a scheduled slot and the Stream call
 * it corresponds to (a call session only knows its student/teacher/start
 * time), so we pair them up by proximity: a call started within this window
 * around the slot's scheduled time is treated as "that class's call".
 */
const MATCH_TOLERANCE_MS = 20 * 60 * 1000;

function toTime(value: Date | string): number {
  return (value instanceof Date ? value : parseISO(value as string)).getTime();
}

/**
 * Greedily pairs each slot with the closest unclaimed call session inside the
 * tolerance window, and returns whatever calls are left over (e.g. a call
 * that happened without a matching curriculum slot).
 */
export function matchCallSessionsToSlots(
  slots: SlotInstanceWithDetails[],
  callHistory: CallSession[]
): { slotsWithCalls: SlotWithCallSession[]; orphanCalls: CallSession[] } {
  const sortedSlots = [...slots].sort((a, b) => toTime(a.startAt) - toTime(b.startAt));
  const availableCalls = [...callHistory];
  const claimedCallIds = new Set<string>();

  const slotsWithCalls: SlotWithCallSession[] = sortedSlots.map((slot) => {
    const slotStart = toTime(slot.startAt);
    const slotEnd = toTime(slot.endAt);

    let best: CallSession | null = null;
    let bestDiff = Infinity;

    for (const call of availableCalls) {
      if (claimedCallIds.has(call.id)) continue;
      const callStart = toTime(call.startedAt);
      if (callStart < slotStart - MATCH_TOLERANCE_MS || callStart > slotEnd + MATCH_TOLERANCE_MS) continue;

      const diff = Math.abs(callStart - slotStart);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = call;
      }
    }

    if (best) claimedCallIds.add(best.id);
    return { ...slot, callSession: best ?? undefined };
  });

  const orphanCalls = callHistory.filter((call) => !claimedCallIds.has(call.id));

  return { slotsWithCalls, orphanCalls };
}
