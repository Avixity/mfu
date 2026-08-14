import { describe, expect, it } from "vitest";

import {
  calculateSpaceJourney,
  earthOrbitalDistance,
  moonRecession,
  SPACE_CONSTANTS,
} from "../src/calculations/space.js";
import {
  comparisonWindow,
  compoundInflation,
  linearInterpolation,
  purchasingPowerEquivalent,
  valueAtYear,
} from "../src/calculations/world.js";
import {
  convertUnit,
  formatCompact,
  formatEstimate,
  formatExact,
  formatScientific,
  roundTo,
} from "../src/utils/format.js";

describe("space calculations", () => {
  it("uses distance = speed × time with matching units", () => {
    expect(earthOrbitalDistance(1)).toBe(107_218);
    expect(earthOrbitalDistance(24)).toBe(2_573_232);
  });

  it("calculates orbital journey values from age in days", () => {
    const result = calculateSpaceJourney(SPACE_CONSTANTS.earthOrbitalPeriodDays);
    expect(result.earthOrbits).toBeCloseTo(1, 12);
    expect(result.completeEarthOrbits).toBe(1);
    expect(result.moonSiderealOrbits).toBeCloseTo(
      SPACE_CONSTANTS.earthOrbitalPeriodDays / SPACE_CONSTANTS.moonSiderealOrbitDays,
      10,
    );
    expect(result.galacticDistanceKilometres).toBeCloseTo(
      SPACE_CONSTANTS.earthOrbitalPeriodDays * 86_400
        * SPACE_CONSTANTS.solarSystemGalacticSpeedKilometresPerSecond,
      5,
    );
  });

  it("expresses lunar recession in centimetres per elapsed mean year", () => {
    expect(moonRecession(15)).toBeCloseTo(57);
  });
});

describe("world-data calculations", () => {
  const series = [
    { year: 2010, value: 10, unit: "%", sourceTitle: "Example source" },
    { year: 2012, value: 14, unit: "%", sourceTitle: "Example source" },
  ];

  it("linearly interpolates only between verified values", () => {
    expect(linearInterpolation(2011, 2010, 10, 2012, 14)).toBe(12);
    expect(valueAtYear(series, 2011)).toMatchObject({
      value: 12,
      interpolated: true,
      method: "linear-interpolation",
    });
    expect(valueAtYear(series, 2009)).toBeNull();
    expect(valueAtYear({ values: series, interpolation: { allowed: false } }, 2011)).toBeNull();
    expect(() => valueAtYear([{ year: 2011, value: null }], 2011)).toThrow();
    expect(() => linearInterpolation(1, 1, 2, 1, 3)).toThrow();
  });

  it("accepts official fiscal-year labels without treating them as decimals", () => {
    const fiscalSeries = {
      interpolation: { allowed: false },
      values: [
        { year: "2011-12", value: 93.3 },
        { year: "2012-13", value: 102.5 },
      ],
    };
    expect(valueAtYear(fiscalSeries, "2011-12")).toMatchObject({
      year: 2011,
      yearLabel: "2011-12",
      value: 93.3,
      interpolated: false,
    });
  });

  it("chooses a source-backed comparison window without extrapolating", () => {
    expect(comparisonWindow(series, 2010)).toMatchObject({
      available: true,
      mode: "birth-year",
      start: { year: 2010, value: 10 },
      latest: { year: 2012, value: 14 },
      dataLagYears: 0,
      startIsInterpolated: false,
    });

    expect(comparisonWindow(series, 2011)).toMatchObject({
      mode: "birth-year",
      start: { year: 2011, value: 12, method: "linear-interpolation" },
      startIsInterpolated: true,
    });

    expect(comparisonWindow(series, 1900)).toMatchObject({
      mode: "series-start",
      start: { year: 2010, value: 10 },
      latest: { year: 2012, value: 14 },
      yearsAfterBirth: 110,
      skippedMissingBirthYear: false,
    });

    expect(comparisonWindow(series, 2011, { interpolateMissing: false })).toMatchObject({
      mode: "series-start",
      start: { year: 2012, value: 14 },
      yearsAfterBirth: 1,
      skippedMissingBirthYear: true,
    });

    expect(comparisonWindow(series, 2014)).toMatchObject({
      mode: "latest-benchmark",
      start: { year: 2012, value: 14 },
      latest: { year: 2012, value: 14 },
      dataLagYears: 2,
    });
  });

  it("rejects an invalid comparison-window birth year", () => {
    expect(() => comparisonWindow(series, "not-a-year")).toThrow(TypeError);
  });

  it("uses price-index ratios and compound rates correctly", () => {
    expect(purchasingPowerEquivalent(100, 80, 120)).toBe(150);
    expect(compoundInflation(100, [10, 10])).toBeCloseTo(121);
  });
});

describe("large-number and unit formatting", () => {
  it("renders full comma-separated values", () => {
    expect(formatExact(618_433_920)).toBe("618,433,920");
  });

  it("uses human-readable international magnitudes", () => {
    expect(formatCompact(14_200_000_000)).toBe("14.2 billion");
    expect(formatCompact(1_090_000_000_000)).toBe("1.09 trillion");
    expect(formatCompact(999_999)).toBe("1 million");
    expect(formatCompact(-999_500)).toBe("-1 million");
  });

  it("renders mathematical scientific notation", () => {
    expect(formatScientific(5_506)).toBe("5.506 × 10³");
    expect(formatScientific(9_999, 2)).toBe("1 × 10⁴");
    expect(formatScientific(0)).toBe("0 × 10⁰");
  });

  it("rounds and converts compatible units", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(-1.005, 2)).toBe(-1.01);
    expect(formatEstimate(123_456, 3)).toBe("123,000");
    expect(convertUnit(3.8, "cm", "mm")).toBeCloseTo(38);
    expect(convertUnit(2, "litres", "millilitres")).toBe(2_000);
    expect(() => convertUnit(1, "days", "km")).toThrow();
  });
});
