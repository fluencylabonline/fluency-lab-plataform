import { describe, it, expect } from "vitest";
import { mergeAudioExtraction } from "../learning.extraction";

describe("mergeAudioExtraction", () => {
  it("fills fields from the AI and keeps defaults for the rest", () => {
    const result = mergeAudioExtraction(undefined, {
      responses: {
        step1: { fullName: "Maria Silva", occupation: "Enfermeira" },
        step3: { mainGoals: ["travel", "work"], commitmentLevel: 8 },
      },
      evidence: { "step1.fullName": "meu nome é Maria Silva" },
    });

    expect(result.responses.step1?.fullName).toBe("Maria Silva");
    expect(result.responses.step3?.mainGoals).toEqual(["travel", "work"]);
    expect(result.responses.step3?.commitmentLevel).toBe(8);
    expect(result.responses.step4?.weeklyFrequency).toBe(1);
    expect(result.filled).toContain("step1.fullName");
    expect(result.evidence["step1.fullName"]).toBe("meu nome é Maria Silva");
  });

  it("never overwrites answers the admin already gave", () => {
    const result = mergeAudioExtraction(
      { step1: { fullName: "João", occupation: "", approximateAge: "", isMinor: false }, step2: { selfAssessedLevel: "B1" } },
      { responses: { step1: { fullName: "Outro Nome", occupation: "Dev" }, step2: { selfAssessedLevel: "C1" } } },
    );

    expect(result.responses.step1?.fullName).toBe("João");
    expect(result.responses.step1?.occupation).toBe("Dev");
    expect(result.responses.step2?.selfAssessedLevel).toBe("B1");
    expect(result.filled).toEqual(["step1.occupation"]);
  });

  it("treats a value equal to the wizard default as empty", () => {
    const result = mergeAudioExtraction(
      { step2: { selfAssessedLevel: "A1", previousStudy: false } },
      { responses: { step2: { selfAssessedLevel: "B2" } } },
    );

    expect(result.responses.step2?.selfAssessedLevel).toBe("B2");
  });

  it("drops invalid, unknown and null values", () => {
    const result = mergeAudioExtraction(undefined, {
      responses: {
        step2: { selfAssessedLevel: "fluente", languageOfInterest: "11111111-1111-4111-8111-111111111111" },
        step3: { commitmentLevel: 99, mainGoals: ["sonhar", "travel"] },
        step4: { preferredTimes: null, madeUpField: "x" },
        step8: { speakingAnxiety: "high" },
      },
    });

    expect(result.responses.step2?.selfAssessedLevel).toBe("A1");
    expect(result.responses.step2?.languageOfInterest).toBeUndefined();
    expect(result.responses.step3?.commitmentLevel).toBe(2);
    expect(result.responses.step3?.mainGoals).toEqual(["travel"]);
    expect(result.responses.step4?.madeUpField).toBeUndefined();
    expect(result.responses.step8?.speakingAnxiety).toBe("high");
    expect(result.filled.sort()).toEqual(["step3.mainGoals", "step8.speakingAnxiety"]);
  });

  it("tolerates an empty or malformed payload", () => {
    const result = mergeAudioExtraction(undefined, {});
    expect(result.filled).toEqual([]);
    expect(Object.keys(result.responses)).toHaveLength(10);
  });
});
