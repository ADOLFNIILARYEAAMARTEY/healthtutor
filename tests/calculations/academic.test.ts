import { describe, expect, it } from "vitest";
import { calculateAcademicAverage, calculateScorePercentage } from "@/lib/calculations/academic";

describe("calculateScorePercentage", () => {
  it("computes score / maximum * 100", () => {
    expect(calculateScorePercentage(15, 20)).toBe(75);
  });

  it("returns 0 when maximumScore is 0", () => {
    expect(calculateScorePercentage(0, 0)).toBe(0);
  });
});

describe("calculateAcademicAverage", () => {
  it("returns null when the student has no scores", () => {
    expect(calculateAcademicAverage([])).toBeNull();
  });

  it("returns the score percentage when there is a single fully-weighted assessment", () => {
    const average = calculateAcademicAverage([{ score: 18, maximumScore: 20, weight: 100 }]);
    expect(average).toBe(90);
  });

  it("computes a weighted average across multiple assessments", () => {
    // Quiz: 8/10 (80%) at weight 20; Exam: 60/100 (60%) at weight 80.
    // Weighted average = (80*20 + 60*80) / (20+80) = 64
    const average = calculateAcademicAverage([
      { score: 8, maximumScore: 10, weight: 20 },
      { score: 60, maximumScore: 100, weight: 80 },
    ]);
    expect(average).toBe(64);
  });

  it("excludes assessments the student has not been scored on (handled by caller passing only scored ones), and ignores zero total weight", () => {
    expect(calculateAcademicAverage([{ score: 5, maximumScore: 10, weight: 0 }])).toBeNull();
  });

  it("does not error when maximumScore is 0 for an assessment", () => {
    const average = calculateAcademicAverage([{ score: 0, maximumScore: 0, weight: 10 }]);
    expect(average).toBe(0);
  });
});
