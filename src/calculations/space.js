export const SPACE_CONSTANTS = Object.freeze({
  earthOrbitalSpeedKilometresPerHour: 107_218,
  earthOrbitalPeriodDays: 365.256_363_004,
  solarSystemGalacticSpeedKilometresPerSecond: 230,
  moonSiderealOrbitDays: 27.321_661,
  moonSynodicCycleDays: 29.530_59,
  moonRecessionCentimetresPerYear: 3.8,
  earthEquatorialCircumferenceKilometres: 40_075,
  meanCalendarYearDays: 365.2425,
});

export const SPACE_SOURCES = Object.freeze({
  earthAndMoon: {
    title: "NASA Moon by the Numbers",
    url: "https://science.nasa.gov/moon/by-the-numbers/",
  },
  moonFacts: {
    title: "NASA GSFC — Eclipses and the Moon's Orbit",
    url: "https://eclipse.gsfc.nasa.gov/SEhelp/moonorbit.html",
  },
  lunarRanging: {
    title: "NASA Apollo Laser Ranging Experiments Yield Results",
    url: "https://eclipse.gsfc.nasa.gov/SEhelp/ApolloLaser.html",
  },
});

function requireNonNegativeFinite(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number.`);
  }
  return value;
}

export function distanceFromSpeedAndTime(speed, time) {
  return requireNonNegativeFinite(speed, "Speed") * requireNonNegativeFinite(time, "Time");
}

export function earthOrbitalDistance(
  ageHours,
  speedKilometresPerHour = SPACE_CONSTANTS.earthOrbitalSpeedKilometresPerHour,
) {
  return distanceFromSpeedAndTime(speedKilometresPerHour, ageHours);
}

export const orbitalDistance = earthOrbitalDistance;

export function earthOrbits(
  ageDays,
  orbitalPeriodDays = SPACE_CONSTANTS.earthOrbitalPeriodDays,
) {
  requireNonNegativeFinite(ageDays, "Age in days");
  if (!Number.isFinite(orbitalPeriodDays) || orbitalPeriodDays <= 0) {
    throw new RangeError("Orbital period must be a positive finite number.");
  }
  return ageDays / orbitalPeriodDays;
}

export function galacticDistance(
  ageSeconds,
  speedKilometresPerSecond = SPACE_CONSTANTS.solarSystemGalacticSpeedKilometresPerSecond,
) {
  return distanceFromSpeedAndTime(speedKilometresPerSecond, ageSeconds);
}

export function moonSiderealOrbits(
  ageDays,
  orbitalPeriodDays = SPACE_CONSTANTS.moonSiderealOrbitDays,
) {
  requireNonNegativeFinite(ageDays, "Age in days");
  if (!Number.isFinite(orbitalPeriodDays) || orbitalPeriodDays <= 0) {
    throw new RangeError("Orbital period must be a positive finite number.");
  }
  return ageDays / orbitalPeriodDays;
}

export function lunarPhaseCycles(
  ageDays,
  synodicPeriodDays = SPACE_CONSTANTS.moonSynodicCycleDays,
) {
  requireNonNegativeFinite(ageDays, "Age in days");
  if (!Number.isFinite(synodicPeriodDays) || synodicPeriodDays <= 0) {
    throw new RangeError("Lunar-cycle period must be a positive finite number.");
  }
  return ageDays / synodicPeriodDays;
}

export function moonRecession(
  ageYears,
  recessionCentimetresPerYear = SPACE_CONSTANTS.moonRecessionCentimetresPerYear,
) {
  return distanceFromSpeedAndTime(recessionCentimetresPerYear, ageYears);
}

export function equatorialRotationDistance(
  ageDays,
  circumferenceKilometres = SPACE_CONSTANTS.earthEquatorialCircumferenceKilometres,
) {
  return distanceFromSpeedAndTime(circumferenceKilometres, ageDays);
}

/** Build the full estimated journey from an elapsed number of days. */
export function calculateSpaceJourney(ageDays, constants = {}) {
  requireNonNegativeFinite(ageDays, "Age in days");
  const values = { ...SPACE_CONSTANTS, ...constants };
  const ageHours = ageDays * 24;
  const ageSeconds = ageDays * 86_400;
  const ageYears = ageDays / values.meanCalendarYearDays;

  return {
    ageDays,
    ageHours,
    ageSeconds,
    ageYears,
    distanceAroundSunKilometres: earthOrbitalDistance(
      ageHours,
      values.earthOrbitalSpeedKilometresPerHour,
    ),
    earthOrbits: earthOrbits(ageDays, values.earthOrbitalPeriodDays),
    completeEarthOrbits: Math.floor(earthOrbits(ageDays, values.earthOrbitalPeriodDays)),
    galacticDistanceKilometres: galacticDistance(
      ageSeconds,
      values.solarSystemGalacticSpeedKilometresPerSecond,
    ),
    moonSiderealOrbits: moonSiderealOrbits(ageDays, values.moonSiderealOrbitDays),
    lunarPhaseCycles: lunarPhaseCycles(ageDays, values.moonSynodicCycleDays),
    moonRecessionCentimetres: moonRecession(
      ageYears,
      values.moonRecessionCentimetresPerYear,
    ),
    equatorialRotationDistanceKilometres: equatorialRotationDistance(
      ageDays,
      values.earthEquatorialCircumferenceKilometres,
    ),
    constants: values,
    classification: "Estimated",
  };
}
