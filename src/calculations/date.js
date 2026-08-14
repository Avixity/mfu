/**
 * Calendar-safe date helpers.
 *
 * Date-only values are converted to UTC midnight before subtraction. This is
 * deliberate: local daylight-saving transitions must never turn a calendar
 * day into 23 or 25 hours in the results.
 */

export const MILLISECONDS_PER_DAY = 86_400_000;
export const MINUTES_PER_DAY = 1_440;
export const SECONDS_PER_DAY = 86_400;

export const WEEKDAY_NAMES = Object.freeze([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

const ISO_DATE_PATTERN = /^(\d{4,})-(\d{2})-(\d{2})$/;

export function isLeapYear(year) {
  return Number.isInteger(year) && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year, month) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return 0;
  }

  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

export function isValidDateParts(year, month, day) {
  return (
    Number.isInteger(year) &&
    year >= 1 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

/**
 * Convert a YYYY-MM-DD string, Date, or { year, month, day } object to plain
 * calendar parts. Date instances intentionally use their local calendar date.
 */
export function parseLocalDate(value) {
  let parts;

  if (typeof value === "string") {
    const match = ISO_DATE_PATTERN.exec(value.trim());
    if (!match) {
      throw new RangeError("Date must use the YYYY-MM-DD format.");
    }
    parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  } else if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new RangeError("Date is invalid.");
    }
    parts = {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
  } else if (value && typeof value === "object") {
    parts = {
      year: Number(value.year),
      month: Number(value.month),
      day: Number(value.day),
    };
  } else {
    throw new TypeError("A date string, Date, or date-parts object is required.");
  }

  if (!isValidDateParts(parts.year, parts.month, parts.day)) {
    throw new RangeError("Date is not a real calendar date.");
  }

  return parts;
}

export function formatIsoDate(value) {
  const { year, month, day } = parseLocalDate(value);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function utcTimestamp(value) {
  const { year, month, day } = parseLocalDate(value);
  // Date.UTC treats years 0–99 as 1900–1999. setUTCFullYear avoids that legacy
  // behaviour and keeps the helper correct for every supported calendar year.
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new RangeError("Date is outside JavaScript's supported calendar range.");
  }
  return timestamp;
}

export function toUtcDayNumber(value) {
  return utcTimestamp(value) / MILLISECONDS_PER_DAY;
}

export function compareCalendarDates(first, second) {
  const a = parseLocalDate(first);
  const b = parseLocalDate(second);
  if (a.year !== b.year) return Math.sign(a.year - b.year);
  if (a.month !== b.month) return Math.sign(a.month - b.month);
  return Math.sign(a.day - b.day);
}

/** Signed number of calendar boundaries from start to end. */
export function differenceInCalendarDays(start, end) {
  return toUtcDayNumber(end) - toUtcDayNumber(start);
}

export const totalCompletedDays = differenceInCalendarDays;

export function validateBirthDate(value, asOf = new Date()) {
  if (value == null || (typeof value === "string" && value.trim() === "")) {
    return { valid: false, code: "required", message: "Enter a date of birth." };
  }

  try {
    const date = parseLocalDate(value);
    const comparisonDate = parseLocalDate(asOf);
    if (compareCalendarDates(date, comparisonDate) > 0) {
      return {
        valid: false,
        code: "future",
        message: "Date of birth cannot be in the future.",
      };
    }
    return { valid: true, code: null, message: "", date };
  } catch (error) {
    return {
      valid: false,
      code: "invalid",
      message: "Enter a real calendar date.",
      error,
    };
  }
}

function addCalendarYears(value, amount) {
  const date = parseLocalDate(value);
  const year = date.year + amount;
  return { year, month: date.month, day: Math.min(date.day, daysInMonth(year, date.month)) };
}

function addCalendarMonths(value, amount) {
  const date = parseLocalDate(value);
  const absoluteMonth = date.year * 12 + (date.month - 1) + amount;
  const year = Math.floor(absoluteMonth / 12);
  const month = ((absoluteMonth % 12) + 12) % 12 + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/**
 * Exact calendar age in completed years, then months, then calendar days.
 * A 29 February anniversary is clamped to 28 February in non-leap years.
 */
export function exactCalendarAge(birthDate, asOf = new Date()) {
  const birth = parseLocalDate(birthDate);
  const end = parseLocalDate(asOf);
  if (compareCalendarDates(birth, end) > 0) {
    throw new RangeError("Birth date cannot be after the comparison date.");
  }

  let years = end.year - birth.year;
  if (compareCalendarDates(addCalendarYears(birth, years), end) > 0) years -= 1;
  const yearAnchor = addCalendarYears(birth, years);

  let months = 0;
  while (months < 11 && compareCalendarDates(addCalendarMonths(yearAnchor, months + 1), end) <= 0) {
    months += 1;
  }
  const monthAnchor = addCalendarMonths(yearAnchor, months);
  const days = differenceInCalendarDays(monthAnchor, end);

  return {
    years,
    months,
    days,
    completedDays: differenceInCalendarDays(birth, end),
  };
}

/**
 * Count weekday dates in the completed-day interval [start, end).
 * For example, a seven-day interval contains each weekday exactly once.
 */
export function countWeekdays(start, end) {
  const startParts = parseLocalDate(start);
  const totalDays = differenceInCalendarDays(startParts, end);
  if (totalDays < 0) throw new RangeError("End date cannot be before start date.");

  const fullWeeks = Math.floor(totalDays / 7);
  const remainder = totalDays % 7;
  const counts = Object.fromEntries(WEEKDAY_NAMES.map((name) => [name, fullWeeks]));
  const startingWeekday = new Date(utcTimestamp(startParts)).getUTCDay();

  for (let offset = 0; offset < remainder; offset += 1) {
    counts[WEEKDAY_NAMES[(startingWeekday + offset) % 7]] += 1;
  }
  return counts;
}

export const weekdayCountsBetween = countWeekdays;

export function countMondays(start, end) {
  return countWeekdays(start, end).Monday;
}

export function countWeekends(start, end) {
  const counts = countWeekdays(start, end);
  return counts.Saturday + counts.Sunday;
}

/** Count 29 February dates in the completed-day interval [start, end). */
export function countLeapDays(start, end) {
  const first = parseLocalDate(start);
  const last = parseLocalDate(end);
  if (compareCalendarDates(first, last) > 0) {
    throw new RangeError("End date cannot be before start date.");
  }

  let count = 0;
  for (let year = first.year; year <= last.year; year += 1) {
    if (!isLeapYear(year)) continue;
    const leapDay = { year, month: 2, day: 29 };
    if (compareCalendarDates(leapDay, first) >= 0 && compareCalendarDates(leapDay, last) < 0) {
      count += 1;
    }
  }
  return count;
}

export const countLeapDaysExperienced = countLeapDays;

export function birthdayAnniversaryInYear(birthDate, year) {
  const birth = parseLocalDate(birthDate);
  return {
    year,
    month: birth.month,
    day: Math.min(birth.day, daysInMonth(year, birth.month)),
  };
}

/** Progress from the most recent birthday to the next one, as a percentage. */
export function percentageThroughAgeYear(birthDate, asOf = new Date()) {
  const birth = parseLocalDate(birthDate);
  const end = parseLocalDate(asOf);
  if (compareCalendarDates(birth, end) > 0) throw new RangeError("Birth date is in the future.");

  let last = birthdayAnniversaryInYear(birth, end.year);
  if (compareCalendarDates(last, end) > 0) last = birthdayAnniversaryInYear(birth, end.year - 1);
  const next = birthdayAnniversaryInYear(birth, last.year + 1);
  const elapsed = differenceInCalendarDays(last, end);
  const duration = differenceInCalendarDays(last, next);
  return duration === 0 ? 0 : (elapsed / duration) * 100;
}

/** Percentage of the exact calendar interval ending on the 100th birthday. */
export function percentageOfCentury(birthDate, asOf = new Date()) {
  const birth = parseLocalDate(birthDate);
  const end = parseLocalDate(asOf);
  const hundredthBirthday = addCalendarYears(birth, 100);
  const elapsed = differenceInCalendarDays(birth, end);
  const centuryDays = differenceInCalendarDays(birth, hundredthBirthday);
  return (elapsed / centuryDays) * 100;
}

/** Date-based elapsed units; sub-day totals are explicitly approximate. */
export function elapsedTime(birthDate, now = new Date()) {
  const birth = parseLocalDate(birthDate);
  const days = differenceInCalendarDays(birth, now);
  if (days < 0) throw new RangeError("Birth date is in the future.");
  return {
    days,
    hours: days * 24,
    minutes: days * MINUTES_PER_DAY,
    seconds: days * SECONDS_PER_DAY,
    approximateSubDayUnits: true,
  };
}

export function buildTimeSummary(birthDate, asOf = new Date()) {
  const age = exactCalendarAge(birthDate, asOf);
  const weekdays = countWeekdays(birthDate, asOf);
  return {
    ...age,
    weeks: age.completedDays / 7,
    completedWeeks: Math.floor(age.completedDays / 7),
    birthdays: age.years,
    leapDays: countLeapDays(birthDate, asOf),
    weekdays,
    Mondays: weekdays.Monday,
    weekends: weekdays.Saturday + weekdays.Sunday,
    centuryPercent: percentageOfCentury(birthDate, asOf),
    ageYearPercent: percentageThroughAgeYear(birthDate, asOf),
    estimatedSeasons: (age.completedDays / 365.2425) * 4,
  };
}
