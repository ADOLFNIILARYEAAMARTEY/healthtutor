import { describe, expect, it } from "vitest";
import { isScoreWithinRange } from "@/lib/validation/assessments";

describe("isScoreWithinRange", () => {
  it("accepts a score of 0", () => {
    expect(isScoreWithinRange(0, 20)).toBe(true);
  });

  it("rejects a negative score", () => {
    expect(isScoreWithinRange(-1, 20)).toBe(false);
  });

  it("accepts a score equal to the maximum", () => {
    expect(isScoreWithinRange(20, 20)).toBe(true);
  });

  it("rejects a score greater than the maximum", () => {
    expect(isScoreWithinRange(21, 20)).toBe(false);
  });

  it("accepts a score within range", () => {
    expect(isScoreWithinRange(15.5, 20)).toBe(true);
  });
});
