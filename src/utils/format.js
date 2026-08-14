const DEFAULT_LOCALE = "en-US";

const SUPERSCRIPT_CHARACTERS = Object.freeze({
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
});

export function roundTo(value, decimalPlaces = 0) {
  if (!Number.isFinite(value)) return value;
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 15) {
    throw new RangeError("Decimal places must be an integer from 0 to 15.");
  }
  const scale = 10 ** decimalPlaces;
  return Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * scale) / scale;
}

export function formatNumber(
  value,
  {
    maximumFractionDigits = 2,
    minimumFractionDigits = 0,
    useGrouping = true,
    locale = DEFAULT_LOCALE,
  } = {},
) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    minimumFractionDigits,
    useGrouping,
  }).format(value);
}

export function formatExact(value, locale = DEFAULT_LOCALE) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(value);
}

export const formatFullNumber = formatExact;

const COMPACT_SCALES = Object.freeze([
  { threshold: 1e18, divisor: 1e18, word: "quintillion" },
  { threshold: 1e15, divisor: 1e15, word: "quadrillion" },
  { threshold: 1e12, divisor: 1e12, word: "trillion" },
  { threshold: 1e9, divisor: 1e9, word: "billion" },
  { threshold: 1e6, divisor: 1e6, word: "million" },
  { threshold: 1e3, divisor: 1e3, word: "thousand" },
]);

function automaticCompactDecimals(scaled) {
  const absolute = Math.abs(scaled);
  if (absolute >= 100) return 0;
  if (absolute >= 10) return 1;
  return 2;
}

/** Use readable words such as "14.2 billion" while preserving sign. */
export function formatCompact(value, { maximumFractionDigits, minimumThreshold = 1_000 } = {}) {
  if (!Number.isFinite(value)) return "—";
  const absolute = Math.abs(value);
  if (absolute < minimumThreshold) {
    return formatNumber(value, { maximumFractionDigits: maximumFractionDigits ?? 2 });
  }
  const scale = COMPACT_SCALES.find(({ threshold }) => absolute >= threshold);
  if (!scale) return formatNumber(value, { maximumFractionDigits: maximumFractionDigits ?? 2 });
  let selectedScale = scale;
  let scaled = value / selectedScale.divisor;
  let decimalDigits = maximumFractionDigits ?? automaticCompactDecimals(scaled);
  const scaleIndex = COMPACT_SCALES.indexOf(selectedScale);
  if (roundTo(Math.abs(scaled), decimalDigits) >= 1_000 && scaleIndex > 0) {
    selectedScale = COMPACT_SCALES[scaleIndex - 1];
    scaled = value / selectedScale.divisor;
    decimalDigits = maximumFractionDigits ?? automaticCompactDecimals(scaled);
  }
  return `${formatNumber(scaled, {
    maximumFractionDigits: decimalDigits,
  })} ${selectedScale.word}`;
}

export function toSuperscript(value) {
  return String(value)
    .split("")
    .map((character) => SUPERSCRIPT_CHARACTERS[character] ?? character)
    .join("");
}

/** Mathematical scientific notation, for example 1.234 × 10⁶. */
export function formatScientific(value, significantDigits = 4) {
  if (!Number.isFinite(value)) return "—";
  if (!Number.isInteger(significantDigits) || significantDigits < 1 || significantDigits > 15) {
    throw new RangeError("Significant digits must be an integer from 1 to 15.");
  }
  if (value === 0) return "0 × 10⁰";

  // toExponential also handles rounding across a power-of-ten boundary: 9,999
  // to two significant figures becomes 1 × 10⁴, never 10 × 10³.
  const [coefficientPart, exponentPart] = value.toExponential(significantDigits - 1).split("e");
  const exponent = Number(exponentPart);
  const coefficientText = Number(coefficientPart).toString();
  return `${coefficientText} × 10${toSuperscript(exponent)}`;
}

export function formatPercent(value, maximumFractionDigits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value, { maximumFractionDigits })}%`;
}

export function formatWithUnit(
  value,
  unit,
  { compact = false, maximumFractionDigits = 2 } = {},
) {
  const formatted = compact
    ? formatCompact(value, { maximumFractionDigits })
    : formatNumber(value, { maximumFractionDigits });
  return `${formatted} ${unit}`.trim();
}

const UNIT_DEFINITIONS = Object.freeze({
  millimetre: { dimension: "length", factor: 0.001 },
  millimetres: { dimension: "length", factor: 0.001 },
  mm: { dimension: "length", factor: 0.001 },
  centimetre: { dimension: "length", factor: 0.01 },
  centimetres: { dimension: "length", factor: 0.01 },
  cm: { dimension: "length", factor: 0.01 },
  metre: { dimension: "length", factor: 1 },
  metres: { dimension: "length", factor: 1 },
  m: { dimension: "length", factor: 1 },
  kilometre: { dimension: "length", factor: 1_000 },
  kilometres: { dimension: "length", factor: 1_000 },
  km: { dimension: "length", factor: 1_000 },
  millilitre: { dimension: "volume", factor: 0.001 },
  millilitres: { dimension: "volume", factor: 0.001 },
  ml: { dimension: "volume", factor: 0.001 },
  litre: { dimension: "volume", factor: 1 },
  litres: { dimension: "volume", factor: 1 },
  l: { dimension: "volume", factor: 1 },
  second: { dimension: "time", factor: 1 },
  seconds: { dimension: "time", factor: 1 },
  minute: { dimension: "time", factor: 60 },
  minutes: { dimension: "time", factor: 60 },
  hour: { dimension: "time", factor: 3_600 },
  hours: { dimension: "time", factor: 3_600 },
  day: { dimension: "time", factor: 86_400 },
  days: { dimension: "time", factor: 86_400 },
});

export function convertUnit(value, fromUnit, toUnit) {
  if (!Number.isFinite(value)) throw new TypeError("Value must be finite.");
  const from = UNIT_DEFINITIONS[String(fromUnit).toLowerCase()];
  const to = UNIT_DEFINITIONS[String(toUnit).toLowerCase()];
  if (!from || !to) throw new RangeError("Unsupported unit.");
  if (from.dimension !== to.dimension) throw new RangeError("Units measure different dimensions.");
  return (value * from.factor) / to.factor;
}

export function formatDistanceKilometres(value) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) < 1) {
    return `${formatNumber(convertUnit(value, "km", "m"), { maximumFractionDigits: 1 })} m`;
  }
  return `${formatCompact(value)} km`;
}

/** Precision suitable for estimates: three significant figures at most. */
export function formatEstimate(value, significantDigits = 3) {
  if (!Number.isFinite(value)) return "—";
  if (!Number.isInteger(significantDigits) || significantDigits < 1 || significantDigits > 15) {
    throw new RangeError("Significant digits must be an integer from 1 to 15.");
  }
  if (value === 0) return "0";
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const decimalPlaces = Math.min(15, Math.max(0, significantDigits - magnitude - 1));
  const rounded = Number(value.toPrecision(significantDigits));
  return formatNumber(rounded, { maximumFractionDigits: decimalPlaces });
}
