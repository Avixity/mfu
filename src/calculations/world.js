/** Standard straight-line interpolation between two known points. */
export function linearInterpolation(x, x0, y0, x1, y1) {
  for (const [name, value] of Object.entries({ x, x0, y0, x1, y1 })) {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite.`);
  }
  if (x0 === x1) throw new RangeError("Interpolation points must have different x-values.");
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

export const interpolate = linearInterpolation;

function seriesInput(series) {
  if (Array.isArray(series)) return { points: series, metadata: {} };
  if (series && typeof series === "object" && Array.isArray(series.values)) {
    return { points: series.values, metadata: series };
  }
  return { points: null, metadata: {} };
}

function yearCoordinate(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const fiscalMatch = /^(\d{4})-(?:\d{2}|\d{4})$/.exec(String(value));
  return fiscalMatch ? Number(fiscalMatch[1]) : Number.NaN;
}

function normaliseSeries(series) {
  const { points, metadata } = seriesInput(series);
  if (!points || points.length === 0) {
    throw new TypeError("A non-empty data series is required.");
  }
  const sorted = points.map((point) => {
    if (point.value == null || point.value === "") {
      throw new TypeError("Missing observations must not be treated as numeric zeroes.");
    }
    const originalYear = point.year;
    const year = yearCoordinate(originalYear);
    const value = Number(point.value);
    if (!Number.isFinite(year) || !Number.isFinite(value)) {
      throw new TypeError("Every data point needs finite year and value fields.");
    }
    return {
      ...point,
      year,
      yearLabel: typeof originalYear === "string" ? originalYear : undefined,
      value,
      unit: point.unit ?? metadata.unit,
      sourceTitle: point.sourceTitle ?? metadata.source?.title,
      sourceUrl: point.sourceUrl ?? metadata.source?.url,
      accessed: point.accessed ?? point.dateAccessed ?? metadata.source?.dateAccessed,
      seriesId: point.seriesId ?? metadata.id,
    };
  }).sort((first, second) => first.year - second.year);

  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].year === sorted[index - 1].year) {
      throw new RangeError(`Duplicate data year: ${sorted[index].year}.`);
    }
  }
  return sorted;
}

export function latestDataPoint(series) {
  return normaliseSeries(series).at(-1);
}

/**
 * Retrieve an official point or interpolate only between surrounding points.
 * This function never silently extrapolates beyond the verified dataset.
 */
export function valueAtYear(series, targetYear, { interpolateMissing = true } = {}) {
  const targetCoordinate = yearCoordinate(targetYear);
  if (!Number.isFinite(targetCoordinate)) {
    throw new TypeError("Target year must be a year number or fiscal-year label.");
  }
  const sorted = normaliseSeries(series);
  const exact = sorted.find((point) => point.year === targetCoordinate);
  if (exact) {
    return {
      ...exact,
      targetYear,
      method: "official",
      interpolated: false,
      surroundingPoints: [exact],
    };
  }

  const datasetForbidsInterpolation =
    !Array.isArray(series) && series?.interpolation?.allowed === false;
  if (!interpolateMissing || datasetForbidsInterpolation) return null;
  const upperIndex = sorted.findIndex((point) => point.year > targetCoordinate);
  if (upperIndex <= 0) return null;
  const lower = sorted[upperIndex - 1];
  const upper = sorted[upperIndex];
  const value = linearInterpolation(
    targetCoordinate,
    lower.year,
    lower.value,
    upper.year,
    upper.value,
  );
  return {
    year: targetYear,
    targetYear,
    value,
    unit: lower.unit ?? upper.unit,
    sourceTitle: lower.sourceTitle ?? upper.sourceTitle,
    sourceUrl: lower.sourceUrl ?? upper.sourceUrl,
    accessed: lower.accessed ?? upper.accessed,
    notes: "Linearly interpolated between surrounding annual observations; not an official measurement.",
    method: "linear-interpolation",
    interpolated: true,
    surroundingPoints: [lower, upper],
  };
}

/** Convert a date to a fractional year using exact UTC calendar-day counts. */
export function decimalYear(value) {
  let year;
  let month;
  let day;
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new RangeError("Date must use YYYY-MM-DD.");
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
    year = value.getFullYear();
    month = value.getMonth() + 1;
    day = value.getDate();
  } else if (value && typeof value === "object") {
    ({ year, month, day } = value);
    year = Number(year);
    month = Number(month);
    day = Number(day);
  } else {
    throw new TypeError("A local date is required.");
  }

  const makeUtcStamp = (targetYear, targetMonth, targetDay) => {
    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(targetYear, targetMonth - 1, targetDay);
    return date.getTime();
  };
  const stamp = makeUtcStamp(year, month, day);
  const start = makeUtcStamp(year, 1, 1);
  const end = makeUtcStamp(year + 1, 1, 1);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    new Date(stamp).getUTCFullYear() !== year ||
    new Date(stamp).getUTCMonth() + 1 !== month ||
    new Date(stamp).getUTCDate() !== day
  ) {
    throw new RangeError("Date is not a real calendar date.");
  }
  return year + (stamp - start) / (end - start);
}

export function percentChange(startValue, endValue) {
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) {
    throw new TypeError("Values must be finite.");
  }
  if (startValue === 0) return null;
  return ((endValue - startValue) / Math.abs(startValue)) * 100;
}

/**
 * Compare a birth-year value to the latest verified observation. If the exact
 * birth year is absent, interpolation is limited to surrounding observations.
 */
export function compareSeriesFromYear(series, birthYear) {
  const birth = valueAtYear(series, birthYear);
  const latest = latestDataPoint(series);
  if (!birth) {
    const sorted = normaliseSeries(series);
    const coordinate = yearCoordinate(birthYear);
    const withinVerifiedRange =
      Number.isFinite(coordinate) &&
      coordinate >= sorted[0].year &&
      coordinate <= sorted.at(-1).year;
    return {
      available: false,
      reason: withinVerifiedRange
        ? "No official observation exists for that year, and interpolation is unavailable or not permitted."
        : "The birth year lies outside the verified data range.",
      birthYear,
      latest,
    };
  }
  return {
    available: true,
    birth,
    latest,
    absoluteChange: latest.value - birth.value,
    percentageChange: percentChange(birth.value, latest.value),
    classification: "Data-based",
  };
}

/** ₹amount in the base year expressed using a later CPI index. */
export function purchasingPowerEquivalent(amount, baseIndex, latestIndex) {
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError("Amount must be non-negative.");
  if (!Number.isFinite(baseIndex) || baseIndex <= 0) {
    throw new RangeError("Base price index must be positive.");
  }
  if (!Number.isFinite(latestIndex) || latestIndex <= 0) {
    throw new RangeError("Latest price index must be positive.");
  }
  return amount * (latestIndex / baseIndex);
}

/** Compound a sequence of percentage inflation rates. */
export function compoundInflation(amount, annualRatesPercent) {
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError("Amount must be non-negative.");
  if (!Array.isArray(annualRatesPercent)) throw new TypeError("Rates must be an array.");
  return annualRatesPercent.reduce((value, rate) => {
    if (!Number.isFinite(rate) || rate <= -100) {
      throw new RangeError("Each inflation rate must be finite and greater than -100%.");
    }
    return value * (1 + rate / 100);
  }, amount);
}

export function chartPoints(series, width, height, padding = 8) {
  const sorted = normaliseSeries(series);
  if (
    ![width, height, padding].every(Number.isFinite) ||
    padding < 0 ||
    width <= padding * 2 ||
    height <= padding * 2
  ) {
    throw new RangeError("Chart dimensions must leave a positive plotting area.");
  }
  const minYear = sorted[0].year;
  const maxYear = sorted.at(-1).year;
  const values = sorted.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yearSpan = maxYear - minYear;
  const valueSpan = maxValue - minValue;

  return sorted.map((point) => ({
    ...point,
    x: yearSpan === 0
      ? width / 2
      : padding + ((point.year - minYear) / yearSpan) * (width - padding * 2),
    y: valueSpan === 0
      ? height / 2
      : height - padding - ((point.value - minValue) / valueSpan) * (height - padding * 2),
  }));
}
