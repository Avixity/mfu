/** Educational biological models, not medical measurements. */

export const DAYS_PER_MEAN_YEAR = 365.2425;

export const DEFAULT_BODY_ASSUMPTIONS = Object.freeze({
  heartRateBpm: 78,
  cardiacOutputLitresPerMinute: 5,
  breathsPerMinute: 16,
  blinksPerAwakeMinute: 15,
  stepsPerDay: 7_000,
  stepLengthMetres: 0.7,
  redBloodCellsPerSecond: 2_400_000,
  hairGrowthMillimetresPerDay: 0.35,
  fingernailGrowthMillimetresPerDay: 0.1,
  mealsPerDay: 3,
  waterLitresPerDay: 2,
});

/**
 * Midpoints of age-specific sleep ranges based on the National Sleep
 * Foundation recommendations published in Sleep Health (2015).
 * Ages are half-open intervals: [minimum, maximum).
 */
export const SLEEP_AGE_BANDS = Object.freeze([
  { minimumAgeYears: 0, maximumAgeYears: 4 / 12, hoursPerDay: 15.5, label: "0–3 months" },
  { minimumAgeYears: 4 / 12, maximumAgeYears: 1, hoursPerDay: 13.5, label: "4–11 months" },
  { minimumAgeYears: 1, maximumAgeYears: 3, hoursPerDay: 12.5, label: "1–2 years" },
  { minimumAgeYears: 3, maximumAgeYears: 6, hoursPerDay: 11.5, label: "3–5 years" },
  { minimumAgeYears: 6, maximumAgeYears: 14, hoursPerDay: 10, label: "6–13 years" },
  { minimumAgeYears: 14, maximumAgeYears: 18, hoursPerDay: 9, label: "14–17 years" },
  { minimumAgeYears: 18, maximumAgeYears: 65, hoursPerDay: 8, label: "18–64 years" },
  { minimumAgeYears: 65, maximumAgeYears: Number.POSITIVE_INFINITY, hoursPerDay: 7.5, label: "65+ years" },
]);

export const SLEEP_MODEL_SOURCE = Object.freeze({
  title: "National Sleep Foundation's sleep time duration recommendations",
  url: "https://doi.org/10.1016/j.sleh.2014.12.010",
  note: "The model uses the midpoint of each recommended age range.",
});

/** Broad illustrative uncertainty bands for showing how variable rates can be. */
export const BODY_UNCERTAINTY_PERCENT = Object.freeze({
  heartbeats: 20,
  bloodPumpedLitres: 30,
  breaths: 25,
  blinks: 40,
  sleepHours: 15,
  redBloodCellsProduced: 25,
  hairGrowthMillimetres: 35,
  fingernailGrowthMillimetres: 35,
  steps: 50,
  distanceWalkedKilometres: 55,
  meals: 20,
  waterLitres: 40,
});

function assertNonNegativeFinite(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number.`);
  }
}

function assertRate(value, name) {
  assertNonNegativeFinite(value, name);
  return value;
}

export function calculateHeartbeats(ageMinutes, heartRateBpm = DEFAULT_BODY_ASSUMPTIONS.heartRateBpm) {
  assertNonNegativeFinite(ageMinutes, "Age in minutes");
  return ageMinutes * assertRate(heartRateBpm, "Heart rate");
}

export function calculateBloodPumped(
  ageMinutes,
  litresPerMinute = DEFAULT_BODY_ASSUMPTIONS.cardiacOutputLitresPerMinute,
) {
  assertNonNegativeFinite(ageMinutes, "Age in minutes");
  return ageMinutes * assertRate(litresPerMinute, "Cardiac output");
}

export function calculateBreaths(ageMinutes, breathsPerMinute = DEFAULT_BODY_ASSUMPTIONS.breathsPerMinute) {
  assertNonNegativeFinite(ageMinutes, "Age in minutes");
  return ageMinutes * assertRate(breathsPerMinute, "Breathing rate");
}

export function calculateBlinks(
  awakeMinutes,
  blinksPerMinute = DEFAULT_BODY_ASSUMPTIONS.blinksPerAwakeMinute,
) {
  assertNonNegativeFinite(awakeMinutes, "Awake minutes");
  return awakeMinutes * assertRate(blinksPerMinute, "Blink rate");
}

/**
 * Integrate sleep over each age band. The day/year conversion is an explicit
 * modelling assumption, so this result remains Estimated rather than Exact.
 */
export function calculatePiecewiseSleep(ageDays, bands = SLEEP_AGE_BANDS) {
  assertNonNegativeFinite(ageDays, "Age in days");
  let totalHours = 0;
  const segments = [];

  for (const band of bands) {
    const startDay = band.minimumAgeYears * DAYS_PER_MEAN_YEAR;
    const endDay = Number.isFinite(band.maximumAgeYears)
      ? band.maximumAgeYears * DAYS_PER_MEAN_YEAR
      : ageDays;
    const daysInBand = Math.max(0, Math.min(ageDays, endDay) - startDay);
    if (daysInBand <= 0) continue;

    const hours = daysInBand * band.hoursPerDay;
    totalHours += hours;
    segments.push({
      label: band.label,
      days: daysInBand,
      hoursPerDay: band.hoursPerDay,
      hours,
    });
  }

  return { totalHours, segments, source: SLEEP_MODEL_SOURCE, model: "piecewise-age-bands" };
}

export function calculateFixedSleep(ageDays, hoursPerDay) {
  assertNonNegativeFinite(ageDays, "Age in days");
  assertNonNegativeFinite(hoursPerDay, "Sleep hours per day");
  if (hoursPerDay > 24) throw new RangeError("Sleep hours per day cannot exceed 24.");
  return {
    totalHours: ageDays * hoursPerDay,
    segments: [{ label: "Visitor-selected rate", days: ageDays, hoursPerDay, hours: ageDays * hoursPerDay }],
    source: null,
    model: "fixed-user-assumption",
  };
}

export function estimateRange(value, uncertaintyPercent) {
  assertNonNegativeFinite(value, "Estimated value");
  assertNonNegativeFinite(uncertaintyPercent, "Uncertainty percentage");
  const margin = value * (uncertaintyPercent / 100);
  return { low: Math.max(0, value - margin), high: value + margin, margin };
}

/**
 * Calculate all body models from one age and one assumptions object.
 * `sleepHoursPerDay` is optional; when absent, the piecewise age model is used.
 */
export function estimateBody(ageDays, overrides = {}) {
  assertNonNegativeFinite(ageDays, "Age in days");
  // Accept the concise names used by the Estimate Lab as well as the explicit
  // unit-bearing API names. Explicit canonical names take precedence.
  const normalisedOverrides = { ...overrides };
  const aliases = {
    heartRate: "heartRateBpm",
    breathRate: "breathsPerMinute",
    sleepHours: "sleepHoursPerDay",
    blinkRate: "blinksPerAwakeMinute",
    stepLength: "stepLengthMetres",
    waterLitres: "waterLitresPerDay",
  };
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (normalisedOverrides[canonical] == null && normalisedOverrides[alias] != null) {
      normalisedOverrides[canonical] = normalisedOverrides[alias];
    }
    delete normalisedOverrides[alias];
  }
  const assumptions = { ...DEFAULT_BODY_ASSUMPTIONS, ...normalisedOverrides };

  for (const [name, value] of Object.entries(assumptions)) {
    if (name === "sleepHoursPerDay" && value == null) continue;
    assertNonNegativeFinite(value, name);
  }
  if (assumptions.sleepHoursPerDay > 24) {
    throw new RangeError("sleepHoursPerDay cannot exceed 24.");
  }

  const ageMinutes = ageDays * 24 * 60;
  const ageSeconds = ageDays * 24 * 60 * 60;
  const sleep = assumptions.sleepHoursPerDay == null
    ? calculatePiecewiseSleep(ageDays)
    : calculateFixedSleep(ageDays, assumptions.sleepHoursPerDay);
  const awakeHours = Math.max(0, ageDays * 24 - sleep.totalHours);
  const awakeMinutes = awakeHours * 60;

  const values = {
    heartbeats: calculateHeartbeats(ageMinutes, assumptions.heartRateBpm),
    bloodPumpedLitres: calculateBloodPumped(ageMinutes, assumptions.cardiacOutputLitresPerMinute),
    breaths: calculateBreaths(ageMinutes, assumptions.breathsPerMinute),
    blinks: calculateBlinks(awakeMinutes, assumptions.blinksPerAwakeMinute),
    sleepHours: sleep.totalHours,
    redBloodCellsProduced: ageSeconds * assumptions.redBloodCellsPerSecond,
    hairGrowthMillimetres: ageDays * assumptions.hairGrowthMillimetresPerDay,
    fingernailGrowthMillimetres: ageDays * assumptions.fingernailGrowthMillimetresPerDay,
    steps: ageDays * assumptions.stepsPerDay,
    distanceWalkedKilometres:
      (ageDays * assumptions.stepsPerDay * assumptions.stepLengthMetres) / 1_000,
    meals: ageDays * assumptions.mealsPerDay,
    waterLitres: ageDays * assumptions.waterLitresPerDay,
  };

  const ranges = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      estimateRange(value, BODY_UNCERTAINTY_PERCENT[key] ?? 25),
    ]),
  );

  return {
    ...values,
    ageDays,
    ageMinutes,
    ageSeconds,
    awakeHours,
    awakeMinutes,
    assumptions,
    sleepModel: sleep,
    ranges,
    classification: "Estimated",
  };
}

export const calculateBodyEstimates = estimateBody;
export const calculateBodyStats = estimateBody;
