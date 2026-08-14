import { describe, expect, it } from "vitest";
import { calculateAttendancePercentage } from "@/lib/calculations/attendance";

describe("calculateAttendancePercentage", () => {
  it("returns null when there are no sessions", () => {
    expect(calculateAttendancePercentage(0, 0)).toBeNull();
  });

  it("computes a simple percentage", () => {
    expect(calculateAttendancePercentage(3, 4)).toBe(75);
  });

  it("returns 100 when present in every session", () => {
    expect(calculateAttendancePercentage(5, 5)).toBe(100);
  });

  it("returns 0 when absent from every session", () => {
    expect(calculateAttendancePercentage(0, 5)).toBe(0);
  });

  it("handles non-integer percentages", () => {
    expect(calculateAttendancePercentage(1, 3)).toBeCloseTo(33.333, 2);
  });
});
