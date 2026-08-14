import { describe, expect, it } from "vitest";
import { classifyRisk } from "@/lib/calculations/risk";

describe("classifyRisk", () => {
  it("classifies 74% attendance as Attendance Risk (below the 75% threshold)", () => {
    expect(classifyRisk(74, 90)).toBe("ATTENDANCE_RISK");
  });

  it("does not classify 75% attendance as Attendance Risk (at the threshold)", () => {
    expect(classifyRisk(75, 90)).toBe("GOOD_STANDING");
  });

  it("classifies 49% academic average as Academic Risk (below the 50% threshold)", () => {
    expect(classifyRisk(90, 49)).toBe("ACADEMIC_RISK");
  });

  it("does not classify 50% academic average as Academic Risk (at the threshold)", () => {
    expect(classifyRisk(90, 50)).toBe("GOOD_STANDING");
  });

  it("classifies 60% attendance and 40% academic average as High Risk", () => {
    expect(classifyRisk(60, 40)).toBe("HIGH_RISK");
  });

  it("classifies 90% attendance and 80% academic average as Good Standing", () => {
    expect(classifyRisk(90, 80)).toBe("GOOD_STANDING");
  });

  it("treats missing attendance data as not-at-risk for that dimension", () => {
    expect(classifyRisk(null, 30)).toBe("ACADEMIC_RISK");
  });

  it("treats missing academic data as not-at-risk for that dimension", () => {
    expect(classifyRisk(30, null)).toBe("ATTENDANCE_RISK");
  });

  it("is Good Standing when both dimensions have no data", () => {
    expect(classifyRisk(null, null)).toBe("GOOD_STANDING");
  });

  it("respects custom thresholds", () => {
    expect(classifyRisk(85, 90, { attendance: 90 })).toBe("ATTENDANCE_RISK");
    expect(classifyRisk(85, 90, { attendance: 80 })).toBe("GOOD_STANDING");
  });
});
