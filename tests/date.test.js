import { describe, expect, it } from "vitest";

import {
  countLeapDays,
  countWeekdays,
  differenceInCalendarDays,
  elapsedTime,
  exactCalendarAge,
  isLeapYear,
  normaliseDateInput,
  parseLocalDate,
  percentageOfCentury,
  validateBirthDate,
} from "../src/calculations/date.js";

describe("calendar calculations", () => {
  it("normalises natural day-month-year typing", () => {
    expect(normaliseDateInput("18 / 07 / 2011")).toBe("2011-07-18");
    expect(normaliseDateInput("18-07-2011")).toBe("2011-07-18");
    expect(normaliseDateInput("1/7/2011")).toBe("2011-07-01");
    expect(normaliseDateInput("18072011")).toBe("2011-07-18");
    expect(normaliseDateInput("2011-7-18")).toBe("2011-07-18");
    expect(normaliseDateInput("not a date")).toBeNull();
  });

  it("uses the Gregorian leap-year rules", () => {
    expect(isLeapYear(2012)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2011)).toBe(false);
  });

  it("rejects impossible local dates rather than allowing Date rollover", () => {
    expect(() => parseLocalDate("2023-02-29")).toThrow();
    expect(() => parseLocalDate("2024-04-31")).toThrow();
    expect(parseLocalDate("2012-02-29")).toEqual({ year: 2012, month: 2, day: 29 });
  });

  it("calculates whole days in UTC, including leap days", () => {
    expect(differenceInCalendarDays("2012-02-28", "2012-03-01")).toBe(2);
    expect(differenceInCalendarDays("2000-01-01", "2001-01-01")).toBe(366);
    expect(differenceInCalendarDays("2011-07-18", "2026-08-14")).toBe(5_506);
  });

  it("calculates exact years, months and days without dividing by 365", () => {
    expect(exactCalendarAge("2011-07-18", "2026-08-14")).toEqual({
      years: 15,
      months: 0,
      days: 27,
      completedDays: 5_506,
    });
    expect(exactCalendarAge("2000-01-01", "2001-01-01")).toMatchObject({
      years: 1,
      months: 0,
      days: 0,
    });
  });

  it("uses a documented 28 February anniversary for leap-day births in non-leap years", () => {
    expect(exactCalendarAge("2012-02-29", "2025-02-28")).toMatchObject({
      years: 13,
      months: 0,
      days: 0,
    });
  });

  it("accepts today and rejects an invalid future date", () => {
    const now = new Date(2026, 7, 14, 12, 0, 0);
    expect(validateBirthDate("2026-08-14", now).valid).toBe(true);
    expect(validateBirthDate("2026-08-15", now)).toMatchObject({ valid: false, code: "future" });
    expect(validateBirthDate("2026-02-29", now)).toMatchObject({ valid: false, code: "invalid" });
    expect(validateBirthDate("999999-01-01", now)).toMatchObject({ valid: false, code: "future" });
    expect(exactCalendarAge("2026-08-14", now).completedDays).toBe(0);
  });

  it("counts each weekday across completed calendar dates", () => {
    const counts = countWeekdays("2024-01-01", "2024-01-08");
    expect(Object.values(counts)).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(countWeekdays("2011-07-18", "2026-08-14").Monday).toBe(787);
  });

  it("counts leap days in the half-open lived-day interval", () => {
    expect(countLeapDays("2011-07-18", "2026-08-14")).toBe(4);
    expect(countLeapDays("2012-02-29", "2012-03-01")).toBe(1);
    expect(countLeapDays("2012-02-29", "2012-02-29")).toBe(0);
  });

  it("keeps date-based sub-day totals explicitly approximate", () => {
    expect(elapsedTime("2026-08-13", new Date(2026, 7, 14, 12))).toMatchObject({
      days: 1,
      hours: 24,
      seconds: 86_400,
      approximateSubDayUnits: true,
    });
    expect(elapsedTime("2026-08-14", new Date(2026, 7, 14, 12))).toMatchObject({
      hours: 0,
      approximateSubDayUnits: true,
    });
  });

  it("preserves literal years below 100 in date-based calculations", () => {
    const now = new Date(0);
    now.setHours(2, 0, 0, 0);
    now.setFullYear(99, 0, 2);
    expect(validateBirthDate("0099-01-01", now).valid).toBe(true);
    expect(elapsedTime("0099-01-01", now)).toMatchObject({
      days: 1,
      hours: 24,
      approximateSubDayUnits: true,
    });
  });

  it("measures a century against the actual 100-year calendar interval", () => {
    expect(percentageOfCentury("2000-01-01", "2050-01-01")).toBeCloseTo(50, 2);
  });
});
