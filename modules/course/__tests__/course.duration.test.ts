import { describe, it, expect } from "vitest";
import { normalizeCourseDuration } from "../course.duration";

describe("normalizeCourseDuration", () => {
  it.each([
    ["10", "10h"],
    ["10h", "10h"],
    ["1h30", "1h 30min"],
    ["1h 30min", "1h 30min"],
    ["1H 30 MIN", "1h 30min"],
    ["90min", "1h 30min"],
    ["45 min", "45min"],
    ["45m", "45min"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeCourseDuration(input)).toBe(expected);
  });

  it.each(["", "abc", "1h30x", "0", "0h", "h"])("rejeita %j", (input) => {
    expect(normalizeCourseDuration(input)).toBeNull();
  });
});
