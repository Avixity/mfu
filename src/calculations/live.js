import { calculatePiecewiseSleep } from './body.js';

const SECONDS_PER_DAY = 86_400;
const MINUTES_PER_DAY = 1_440;

function assertNonNegativeFinite(value, label) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite number.`);
  }
}

export function secondsIntoLocalDay(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('A valid Date is required.');
  }

  // Subtracting an actual local-midnight instant is deliberately different
  // from turning the displayed clock fields into seconds. During a daylight-
  // saving fall-back, for example, 01:30 occurs twice; the second occurrence
  // is one real hour later and must therefore return a larger value.
  const midnight = localMidnight(date);
  return (date.getTime() - midnight.getTime()) / 1_000;
}

export function calculateLiveElapsed(ageDays, now = new Date()) {
  assertNonNegativeFinite(ageDays, 'Age in days');
  const currentDaySeconds = secondsIntoLocalDay(now);
  const midnight = localMidnight(now);
  const nextMidnight = shiftLocalDays(midnight, 1);
  const currentDayDurationSeconds = (nextMidnight.getTime() - midnight.getTime()) / 1_000;
  assertNonNegativeFinite(currentDayDurationSeconds, 'Current local day duration');
  if (currentDayDurationSeconds === 0) {
    throw new RangeError('Current local day duration must be greater than zero.');
  }

  const completedDaySeconds = completedCalendarSeconds(ageDays, midnight);
  const nominalCompletedDaySeconds = ageDays * SECONDS_PER_DAY;
  const seconds = completedDaySeconds + currentDaySeconds;
  const currentDayProgress = Math.max(0, Math.min(1, currentDaySeconds / currentDayDurationSeconds));
  const modelledCurrentDayMinutes = currentDayProgress * MINUTES_PER_DAY;
  return {
    days: seconds / SECONDS_PER_DAY,
    hours: seconds / 3_600,
    minutes: seconds / 60,
    seconds,
    completedDaySeconds,
    nominalCompletedDaySeconds,
    currentDaySeconds,
    currentDayDurationSeconds,
    currentDayProgress,
    modelledCurrentDayMinutes,
    approximateSubDayUnits: true,
  };
}

export function calculateLiveBodyCounters(body, elapsed) {
  if (!body?.assumptions || !elapsed) throw new TypeError('Body model and elapsed model are required.');
  const currentDayMinutes = elapsed.currentDaySeconds / 60;
  const assumptions = body.assumptions;
  assertNonNegativeFinite(currentDayMinutes, 'Current-day minutes');
  assertNonNegativeFinite(body.ageDays, 'Body age in days');

  // Rate-based counters follow real elapsed minutes. `elapsed.minutes` includes
  // DST-aware completed calendar days; the fallback retains compatibility with
  // callers that provide the older, smaller elapsed object.
  const liveMinutes = Number.isFinite(elapsed.minutes)
    ? elapsed.minutes
    : body.ageMinutes + currentDayMinutes;
  assertNonNegativeFinite(liveMinutes, 'Live elapsed minutes');

  // A partial day must approach the same total that estimateBody(D + 1) will
  // produce after midnight. Use the marginal sleep assigned to [D, D + 1),
  // not the lifetime-average awake fraction. Normalising by local-day progress
  // also preserves that invariant on 23- and 25-hour DST days.
  const marginalSleepHours = sleepHoursForNextCalendarDay(body);
  const marginalAwakeMinutes = Math.max(0, 24 - marginalSleepHours) * 60;
  const awakeFraction = Math.max(0, Math.min(1, marginalAwakeMinutes / MINUTES_PER_DAY));
  const modelledCurrentDayMinutes = Number.isFinite(elapsed.modelledCurrentDayMinutes)
    ? elapsed.modelledCurrentDayMinutes
    : currentDayMinutes;
  assertNonNegativeFinite(modelledCurrentDayMinutes, 'Modelled current-day minutes');

  return {
    heartbeats: liveMinutes * assumptions.heartRateBpm,
    bloodPumpedLitres: liveMinutes * assumptions.cardiacOutputLitresPerMinute,
    breaths: liveMinutes * assumptions.breathsPerMinute,
    blinks: body.blinks
      + modelledCurrentDayMinutes * awakeFraction * assumptions.blinksPerAwakeMinute,
    awakeFraction,
    marginalAwakeMinutes,
    modelledCurrentDayMinutes,
  };
}

function localMidnight(date) {
  const midnight = new Date(date.getTime());
  midnight.setHours(0, 0, 0, 0);
  return midnight;
}

function shiftLocalDays(date, amount) {
  const shifted = new Date(date.getTime());
  shifted.setDate(shifted.getDate() + amount);
  return shifted;
}

function completedCalendarSeconds(ageDays, currentMidnight) {
  // Production callers pass an integer completed-day count. Retaining a
  // nominal fractional remainder keeps the helper backwards-compatible with
  // any direct callers that used a non-integer value previously.
  const wholeDays = Math.trunc(ageDays);
  const fractionalDays = ageDays - wholeDays;
  const impliedBirthMidnight = shiftLocalDays(currentMidnight, -wholeDays);
  const wholeDaySeconds = (currentMidnight.getTime() - impliedBirthMidnight.getTime()) / 1_000;
  const completedSeconds = wholeDaySeconds + fractionalDays * SECONDS_PER_DAY;
  assertNonNegativeFinite(completedSeconds, 'Completed calendar seconds');
  return completedSeconds;
}

function sleepHoursForNextCalendarDay(body) {
  const fixedSleepHours = body.assumptions.sleepHoursPerDay;
  if (Number.isFinite(fixedSleepHours)) {
    return Math.max(0, Math.min(24, fixedSleepHours));
  }

  const currentSleep = calculatePiecewiseSleep(body.ageDays).totalHours;
  const nextSleep = calculatePiecewiseSleep(body.ageDays + 1).totalHours;
  return Math.max(0, Math.min(24, nextSleep - currentSleep));
}
