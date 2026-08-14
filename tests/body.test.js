import { describe, expect, it } from "vitest";

import {
  calculatePiecewiseSleep,
  estimateBody,
  estimateRange,
} from "../src/calculations/body.js";

describe("biological estimates", () => {
  it("applies the documented default rates with consistent units", () => {
    const result = estimateBody(1, { sleepHoursPerDay: 8 });
    expect(result.heartbeats).toBe(1_440 * 78);
    expect(result.bloodPumpedLitres).toBe(1_440 * 5);
    expect(result.breaths).toBe(1_440 * 16);
    expect(result.blinks).toBe(16 * 60 * 15);
    expect(result.sleepHours).toBe(8);
    expect(result.redBloodCellsProduced).toBe(86_400 * 2_400_000);
    expect(result.steps).toBe(7_000);
    expect(result.distanceWalkedKilometres).toBeCloseTo(4.9);
    expect(result.waterLitres).toBe(2);
    expect(result.classification).toBe("Estimated");
  });

  it("integrates multiple age-dependent sleep bands", () => {
    const ageDays = 10 * 365.2425;
    const sleep = calculatePiecewiseSleep(ageDays);
    expect(sleep.model).toBe("piecewise-age-bands");
    expect(sleep.segments.length).toBe(5);
    expect(sleep.segments.at(-1).label).toBe("6–13 years");
    expect(sleep.totalHours).toBeGreaterThan(ageDays * 10);
    expect(sleep.totalHours).toBeLessThan(ageDays * 14);
  });

  it("lets the Estimate Lab replace the sleep model without changing defaults", () => {
    const piecewise = estimateBody(365).sleepModel;
    const selected = estimateBody(365, { sleepHoursPerDay: 7 }).sleepModel;
    expect(piecewise.model).toBe("piecewise-age-bands");
    expect(selected.model).toBe("fixed-user-assumption");
    expect(selected.totalHours).toBe(2_555);
    expect(estimateBody(1, { heartRate: 60 }).heartbeats).toBe(86_400);
  });

  it("provides transparent illustrative uncertainty ranges", () => {
    expect(estimateRange(100, 20)).toEqual({ low: 80, high: 120, margin: 20 });
    expect(() => estimateBody(-1)).toThrow();
    expect(() => estimateBody(1, { sleepHoursPerDay: 25 })).toThrow();
  });
});
