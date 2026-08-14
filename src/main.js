import {
  WEEKDAY_NAMES,
  buildTimeSummary,
  differenceInCalendarDays,
  exactCalendarAge,
  normaliseDateInput,
  parseLocalDate,
  toUtcDayNumber,
  validateBirthDate,
} from './calculations/date.js';
import {
  calculateLiveBodyCounters,
  calculateLiveElapsed,
} from './calculations/live.js';
import {
  DEFAULT_BODY_ASSUMPTIONS,
  SLEEP_MODEL_SOURCE,
  estimateBody,
} from './calculations/body.js';
import {
  birthdayPairProbability,
  countDistinctArrangements,
  divisors,
  getNumberProperties,
  specificBirthdayProbability,
} from './calculations/numbers.js';
import {
  SPACE_SOURCES,
  calculateSpaceJourney,
} from './calculations/space.js';
import {
  comparisonWindow,
  purchasingPowerEquivalent,
  valueAtYear,
} from './calculations/world.js';
import {
  formatCompact,
  formatDistanceKilometres,
  formatExact,
  formatNumber,
  formatPercent,
  formatScientific,
} from './utils/format.js';
import { animateNumber, createRevealObserver } from './utils/dom.js';
import { MathModal } from './components/math-modal.js';
import { renderTimeline } from './components/timeline.js';
import { EstimateLab } from './components/estimate-lab.js';

async function loadLocalJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load local data: ${label} (${response.status})`);
  return response.json();
}

const [worldData, timeline1900To1949, timeline1950To1999, timeline2000To2026] = await Promise.all([
  loadLocalJson(new URL('./data/world-data.json', import.meta.url), 'world data'),
  loadLocalJson(new URL('./data/math-timeline-1900-1949.json', import.meta.url), '1900–1949 mathematics timeline'),
  loadLocalJson(new URL('./data/math-timeline-1950-1999.json', import.meta.url), '1950–1999 mathematics timeline'),
  loadLocalJson(new URL('./data/math-timeline-2000-2026.json', import.meta.url), '2000–2026 mathematics timeline'),
]);
const timelineData = [...timeline1900To1949, ...timeline1950To1999, ...timeline2000To2026]
  .sort((first, second) => first.year - second.year || String(first.title).localeCompare(String(second.title)));

const STORAGE_KEY = 'mathematics-of-you.birth-date';
const MINIMUM_BIRTH_YEAR = 1900;
const CURRENT_DATA_ACCESS_DATE = worldData.dateAccessed;
const COVID_BOUNDARY = { year: 2020, month: 3, day: 11 };
const LOCAL_CALCULATION_SOURCE = {
  title: 'Calculated locally from the visitor’s input using Gregorian calendar arithmetic',
};
const WHO_COVID_SOURCE = {
  title: 'WHO Director-General’s opening remarks, 11 March 2020',
  url: 'https://www.who.int/news-room/speeches/item/who-director-general-s-opening-remarks-at-the-media-briefing-on-covid-19---11-march-2020',
};
const NASA_PLANET_SOURCE = {
  title: 'NASA/JPL Planetary Physical Parameters',
  url: 'https://ssd.jpl.nasa.gov/planets/phys_par.html',
};
const BIOLOGY_MODEL_SOURCE = {
  title: 'Educational rate assumptions listed in this project’s methodology',
};
const BIRTHDAY_MODEL_SOURCE = {
  title: 'Classical birthday-problem model with 365 equally likely dates',
};
const INDIA_SCHOOL_DAYS_SOURCE = {
  title: 'India Code — Right to Education Act, 2009, Schedule of norms and standards',
  url: 'https://www.indiacode.nic.in/bitstream/123456789/2086/5/a2009-35.pdf',
};

const FINGERPRINT_DEFINITIONS = Object.freeze({
  'fingerprint-decimal': [
    {
      term: 'Decimal (base ten)',
      definition: 'The everyday number system. Each place is worth ten times the place to its right, and it uses the digits 0 to 9.',
    },
    {
      term: 'Completed day',
      definition: 'A whole calendar day that has fully passed since the date of birth; an unfinished current day is not counted.',
    },
  ],
  'fingerprint-representations': [
    {
      term: 'Binary',
      definition: 'A base-two number system using only 0 and 1. Its place values are powers of two.',
    },
    {
      term: 'Hexadecimal',
      definition: 'A base-sixteen number system using 0 to 9 and A to F. Its place values are powers of sixteen.',
    },
    {
      term: 'Roman numerals',
      definition: 'A notation built from symbols such as I, V, X, L, C, D and M instead of place values.',
    },
    {
      term: 'Scientific notation',
      definition: 'A compact way to write a number as a value from 1 up to 10 multiplied by a power of ten.',
    },
  ],
  'fingerprint-prime': [
    {
      term: 'Prime number',
      definition: 'A whole number greater than 1 with exactly two positive factors: 1 and itself.',
    },
    {
      term: 'Composite number',
      definition: 'A whole number greater than 1 with more than two positive factors.',
    },
  ],
  'fingerprint-factors': [
    {
      term: 'Prime factorisation',
      definition: 'Writing a whole number as a product made entirely from prime numbers. Apart from order, the result is unique.',
    },
    {
      term: 'Exponent',
      definition: 'The small raised number that tells how many times a base is multiplied by itself, as in 2 cubed = 2 x 2 x 2.',
    },
  ],
  'fingerprint-divisors': [
    {
      term: 'Factor or divisor',
      definition: 'A whole number that divides another whole number exactly, leaving no remainder.',
    },
    {
      term: 'Factor count',
      definition: 'The number of distinct positive whole-number factors a number has.',
    },
    {
      term: 'Sum of factors',
      definition: 'The result of adding every positive factor of the number, including 1 and the number itself.',
    },
  ],
  'fingerprint-traits': [
    {
      term: 'Even or odd',
      definition: 'An even integer is divisible by 2; an odd integer leaves a remainder of 1 when divided by 2.',
    },
    {
      term: 'Palindrome',
      definition: 'A number whose digits read the same forwards and backwards, such as 5,555.',
    },
    {
      term: 'Triangular number',
      definition: 'A number that can be arranged as a triangle of dots: 1, 3, 6, 10 and so on.',
    },
    {
      term: 'Perfect square',
      definition: 'A whole number made by multiplying an integer by itself, such as 49 = 7 x 7.',
    },
    {
      term: 'Fibonacci number',
      definition: 'A member of the sequence 0, 1, 1, 2, 3, 5, 8... in which each new term is the sum of the previous two.',
    },
    {
      term: 'Digital root',
      definition: 'The single digit reached by repeatedly adding a number\'s digits; for example, 347 becomes 14, then 5.',
    },
  ],
  'fingerprint-next-prime': [
    {
      term: 'Next prime',
      definition: 'The smallest prime number that is greater than the current completed-day age.',
    },
  ],
  'fingerprint-palindromes': [
    {
      term: 'Palindromic age',
      definition: 'An age in completed days whose decimal digits read identically from left to right and right to left.',
    },
  ],
  'fingerprint-ten-thousand': [
    {
      term: 'Difference',
      definition: 'The distance between two numbers found by subtraction; here it measures how far the current age is from 10,000 days.',
    },
  ],
  'fingerprint-century-fraction': [
    {
      term: 'Fraction',
      definition: 'A ratio written as one number over another: the numerator counts parts and the denominator describes the whole.',
    },
    {
      term: 'Greatest common divisor (GCD)',
      definition: 'The largest positive integer that divides two numbers exactly. Dividing both parts of a fraction by it gives simplest form.',
    },
  ],
  'fingerprint-date-arrangements': [
    {
      term: 'Permutation',
      definition: 'An arrangement in which order matters. Swapping two different digits produces a different permutation.',
    },
    {
      term: 'Factorial',
      definition: 'For a positive integer n, n! means n x (n - 1) x ... x 2 x 1. It counts arrangements before repeated items are removed.',
    },
  ],
  'fingerprint-covid': [
    {
      term: 'Percentage',
      definition: 'A ratio expressed out of 100. A lifetime percentage is the relevant days divided by all completed days, multiplied by 100.',
    },
  ],
  'fingerprint-logarithm': [
    {
      term: 'Base-ten logarithm',
      definition: 'The power to which 10 must be raised to make a number. For example, log base 10 of 1,000 is 3 because 10 cubed is 1,000.',
    },
    {
      term: 'Order of magnitude',
      definition: 'A number\'s approximate scale measured in powers of ten. Moving up one order of magnitude means becoming about ten times larger.',
    },
  ],
});

const PLANET_PERIODS = Object.freeze({
  Mercury: 87.969,
  Venus: 224.701,
  Earth: 365.256,
  Mars: 686.98,
  Jupiter: 4_332.59,
  Saturn: 10_759.22,
  Uranus: 30_688.5,
  Neptune: 60_182,
});

const dom = {
  form: document.querySelector('#birth-form'),
  birthDate: document.querySelector('#birth-date'),
  birthDateText: document.querySelector('#birth-date-text'),
  birthDateHint: document.querySelector('#birth-date-hint'),
  birthdayPicker: document.querySelector('#birthday-picker'),
  openCalendar: document.querySelector('#open-calendar'),
  formError: document.querySelector('#form-error'),
  story: document.querySelector('#story'),
  main: document.querySelector('#main-content'),
  openingTitle: document.querySelector('#opening-title'),
  openingDate: document.querySelector('#opening-date'),
  timeStats: document.querySelector('#time-stats'),
  bodyStats: document.querySelector('#body-stats'),
  fingerprintStats: document.querySelector('#fingerprint-stats'),
  worldStats: document.querySelector('#world-stats'),
  spaceStats: document.querySelector('#space-stats'),
  weekdayVisual: document.querySelector('#weekday-visual'),
  portraitNumber: document.querySelector('#portrait-number'),
  portraitBinary: document.querySelector('#portrait-binary'),
  portraitFactors: document.querySelector('#portrait-factors'),
  roomSize: document.querySelector('#room-size'),
  roomSizeOutput: document.querySelector('#room-size-output'),
  probabilityResults: document.querySelector('#probability-results'),
  probabilityStatus: document.querySelector('#probability-status'),
  estimateStatus: document.querySelector('#estimate-status'),
  worldChart: document.querySelector('#world-chart'),
  timelineList: document.querySelector('#timeline-list'),
  timelineNote: document.querySelector('#timeline-note'),
  reportSheet: document.querySelector('#report-sheet'),
  resetTop: document.querySelector('#reset-top'),
  toggleLive: document.querySelector('#toggle-live'),
  toggleLiveIcon: document.querySelector('#toggle-live-icon'),
  toggleLiveLabel: document.querySelector('#toggle-live-label'),
  startAgain: document.querySelector('#start-again'),
  printReport: document.querySelector('#print-report'),
  downloadReport: document.querySelector('#download-report'),
};

const modal = new MathModal(document.querySelector('#math-sheet'));
const mathDetails = {};
const renderedStats = new Map();
let revealObserver = null;
let estimateLab = null;
let liveTicker = null;
let liveRolloverTimer = null;
let livePaused = false;
let state = null;

function pad(value) {
  return String(value).padStart(2, '0');
}

function localIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function displayDate(parts) {
  const local = new Date(0);
  local.setHours(12, 0, 0, 0);
  local.setFullYear(parts.year, parts.month - 1, parts.day);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(local);
}

function plural(value, singular, pluralForm = `${singular}s`) {
  return Math.abs(Number(value)) === 1 ? singular : pluralForm;
}

function roundedInteger(value) {
  return formatExact(Math.round(value));
}

function formatCompactValue(value, digits = 2) {
  return formatCompact(value, { maximumFractionDigits: digits });
}

function detail({
  title,
  classification,
  formula,
  substitution,
  result,
  variables,
  conversions,
  assumptions,
  uncertainty,
  source,
}) {
  return {
    title,
    classification,
    formula,
    substitution,
    result,
    variables: variables || [],
    conversions: conversions || [],
    assumptions: assumptions || [],
    uncertainty: uncertainty || 'None beyond the precision of the supplied date and display rounding.',
    source: source || LOCAL_CALCULATION_SOURCE,
  };
}

function sourceFromSeries(series) {
  return {
    title: series.source.title,
    url: series.source.url,
  };
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function createSvgIcon(name, className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (className) svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#icon-${name}`);
  svg.append(use);
  return svg;
}

function createDefinitionDetails(stat) {
  const definitions = FINGERPRINT_DEFINITIONS[stat.id];
  if (!definitions?.length) return null;

  const details = createElement('details', 'stat__definitions');
  const summary = createElement('summary', '', 'View definitions');
  summary.setAttribute('aria-label', `View definitions for ${stat.math.title}`);
  const list = createElement('dl', 'stat__definition-list');

  for (const { term, definition } of definitions) {
    list.append(
      createElement('dt', '', term),
      createElement('dd', '', definition),
    );
  }

  details.append(summary, list);
  return details;
}

function createStatElement(stat) {
  const article = createElement('article', 'stat');
  article.dataset.statId = stat.id;
  if (stat.live) article.classList.add('stat--live');

  const sentence = createElement('p', 'stat__sentence');
  if (stat.before) sentence.append(document.createTextNode(stat.before));
  const value = createElement('strong', 'stat__value');
  value.id = `stat-value-${stat.id}`;
  value.textContent = stat.numeric == null ? stat.value : stat.formatter(0);
  if (stat.numeric != null) {
    value._numericTarget = stat.numeric;
    value._numericFormatter = stat.formatter;
  }
  value._isLiveCounter = Boolean(stat.live);
  sentence.append(value);
  if (stat.after) sentence.append(document.createTextNode(stat.after));

  const aside = createElement('div', 'stat__aside');
  aside.append(createElement('span', 'classification', stat.classification));
  if (stat.live) {
    const live = createElement('span', 'stat__live');
    live.append(createElement('span', 'stat__live-dot'), createElement('span', 'stat__live-label', livePaused ? 'Paused model' : 'Live model'));
    aside.append(live);
  }
  aside.append(createElement('p', '', stat.note));

  if (stat.fullValue) {
    const full = createElement('details', 'stat__full');
    full.append(createElement('summary', '', 'See the full value'));
    full.append(createElement('code', '', stat.fullValue));
    aside.append(full);
  }

  const definitions = createDefinitionDetails(stat);
  if (definitions) aside.append(definitions);

  const button = createElement('button', 'math-link', 'Show the maths');
  button.type = 'button';
  button.dataset.mathId = stat.id;
  button.setAttribute('aria-label', `Show the maths for ${stat.math.title}`);
  aside.append(button);

  article.append(sentence, aside);
  mathDetails[stat.id] = stat.math;
  renderedStats.set(stat.id, { element: article, value, stat });
  return article;
}

function renderStats(container, stats) {
  container.replaceChildren();
  for (const stat of stats.filter(Boolean)) container.append(createStatElement(stat));
}

function updateRenderedStat(stat) {
  const rendered = renderedStats.get(stat.id);
  if (!rendered) return;
  rendered.stat = stat;
  rendered.value._numericTarget = stat.numeric;
  rendered.value._numericFormatter = stat.formatter;
  rendered.value._isLiveCounter = Boolean(stat.live);
  rendered.value.textContent = stat.numeric == null ? stat.value : stat.formatter(stat.numeric);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rendered.value.animate?.(
      [{ opacity: 0.25, transform: 'translateY(0.35rem)' }, { opacity: 1, transform: 'none' }],
      { duration: 260, easing: 'ease-out' },
    );
  }
  const note = rendered.element.querySelector('.stat__aside p');
  if (note) note.textContent = stat.note;
  const full = rendered.element.querySelector('.stat__full code');
  if (full && stat.fullValue) full.textContent = stat.fullValue;
  mathDetails[stat.id] = stat.math;
  modal.updateDetail(stat.id, stat.math);
}

function initialiseReveals() {
  revealObserver?.disconnect();
  revealObserver = createRevealObserver((element) => {
    const value = element.querySelector?.('.stat__value');
    if (value?._numericTarget != null && !value._isLiveCounter) {
      animateNumber(value, value._numericTarget, value._numericFormatter);
    }
  });
  revealObserver.observe(dom.story);
}

function countMeteorologicalSeasons(birth, today) {
  if (differenceInCalendarDays(birth, today) <= 0) return 0;
  let count = 0;
  const starts = [[3, 1], [6, 1], [9, 1], [12, 1]];
  for (let year = birth.year; year <= today.year; year += 1) {
    for (const [month, day] of starts) {
      const boundary = { year, month, day };
      if (differenceInCalendarDays(birth, boundary) >= 0 && differenceInCalendarDays(boundary, today) > 0) {
        count += 1;
      }
    }
  }
  const beginsOnBoundary = starts.some(([month, day]) => birth.month === month && birth.day === day);
  return count + (beginsOnBoundary ? 0 : 1);
}

function countWeekendPeriods(birth, weekdays) {
  const birthWeekday = new Date(toUtcDayNumber(birth) * 86_400_000).getUTCDay();
  return weekdays.Saturday + (birthWeekday === 0 && weekdays.Sunday > 0 ? 1 : 0);
}

function calendarYearSlices(birth, today) {
  const totalDays = differenceInCalendarDays(birth, today);
  if (totalDays <= 0) return [];
  const slices = [];
  for (let year = birth.year; year <= today.year; year += 1) {
    const start = year === birth.year ? birth : { year, month: 1, day: 1 };
    const end = year === today.year ? today : { year: year + 1, month: 1, day: 1 };
    const days = Math.max(0, differenceInCalendarDays(start, end));
    if (days) slices.push({ year, days, share: days / totalDays * 100 });
  }
  return slices;
}

function uncertaintyText(range, unit, formatter = roundedInteger) {
  return `Illustrative range: ${formatter(range.low)}–${formatter(range.high)} ${unit}. This is a sensitivity band, not a personal medical interval.`;
}

function safeDaysBetween(start, end) {
  return Math.max(0, differenceInCalendarDays(start, end));
}

function anniversaryAtAge(birth, age) {
  const year = birth.year + age;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return {
    year,
    month: birth.month,
    day: birth.month === 2 && birth.day === 29 && !leap ? 28 : birth.day,
  };
}

function schoolDayModel(birth, today) {
  const bands = [
    { startAge: 6, endAge: 11, rate: 200, label: 'ages 6–10 / Classes I–V model' },
    { startAge: 11, endAge: 14, rate: 220, label: 'ages 11–13 / Classes VI–VIII model' },
    { startAge: 14, endAge: 18, rate: 200, label: 'ages 14–17 secondary-school assumption' },
  ];
  const segments = [];
  let total = 0;
  for (const band of bands) {
    const start = anniversaryAtAge(birth, band.startAge);
    const endBoundary = band.endAge == null ? today : anniversaryAtAge(birth, band.endAge);
    const end = compareParts(endBoundary, today) < 0 ? endBoundary : today;
    if (compareParts(start, end) >= 0) continue;
    const calendarDays = differenceInCalendarDays(start, end);
    const equivalentYears = calendarDays / 365.2425;
    const modelledDays = equivalentYears * band.rate;
    total += modelledDays;
    segments.push({ ...band, calendarDays, equivalentYears, modelledDays });
  }
  return { total: Math.round(total), segments };
}

function renderOpening() {
  const { timeSummary } = state;
  dom.openingTitle.replaceChildren();
  const numbers = createElement('span', 'opening__numbers');
  numbers.append(
    createElement('strong', '', `${formatExact(timeSummary.years)} ${plural(timeSummary.years, 'year')}`),
    createElement('i', '', '•'),
    createElement('strong', '', `${formatExact(timeSummary.completedDays)} days`),
  );
  const statement = createElement('span', 'opening__statement', 'One life hidden inside millions of calculations.');
  dom.openingTitle.append(numbers, statement);
  dom.openingDate.textContent = `Calculated from ${displayDate(state.birth)}.`;
}

function buildTimeStats() {
  const { birth, today, timeSummary: summary, elapsed: elapsedUnits } = state;
  const subDayClass = 'Estimated';
  const currentDaySeconds = elapsedUnits.currentDaySeconds;
  const completedDaySeconds = elapsedUnits.completedDaySeconds;
  const subDayNote = 'A live date-based model combines elapsed local calendar intervals with the current time of day.';
  const subDayAssumption = 'The model begins at local midnight on the entered date and applies this device’s current timezone to the full interval.';
  const weekendPeriods = countWeekendPeriods(birth, summary.weekdays);
  const weekendDays = summary.weekdays.Saturday + summary.weekdays.Sunday;
  const seasonCount = countMeteorologicalSeasons(birth, today);
  const yearSlices = calendarYearSlices(birth, today);
  const yearSliceText = yearSlices
    .map(({ year, days, share }) => `${year}: ${formatExact(days)}/${formatExact(summary.completedDays)} = ${formatPercent(share, 2)}`)
    .join('\n');
  const schoolDays = schoolDayModel(birth, today);
  const centuryDays = differenceInCalendarDays(birth, anniversaryAtAge(birth, 100));
  const planetary = Object.fromEntries(
    Object.entries(PLANET_PERIODS).map(([planet, period]) => [planet, summary.completedDays / period]),
  );
  const weekdayList = WEEKDAY_NAMES.map((day) => `${day}: ${formatExact(summary.weekdays[day])}`);

  return [
    {
      id: 'time-calendar-age',
      before: 'Your exact calendar age is ',
      value: `${summary.years} ${plural(summary.years, 'year')}, ${summary.months} ${plural(summary.months, 'month')} and ${summary.days} ${plural(summary.days, 'day')}`,
      after: '.',
      classification: 'Exact',
      note: 'Calendar years and months are counted first; the remaining calendar days come last.',
      math: detail({
        title: 'Exact calendar age', classification: 'Exact',
        formula: 'age = completed calendar years + completed calendar months + remaining calendar days',
        substitution: `${displayDate(birth)} → ${displayDate(today)}`,
        result: `${summary.years} years, ${summary.months} months, ${summary.days} days`,
        variables: [
          'Years are whole anniversaries reached.',
          'Months are whole calendar months after the last anniversary.',
          'Days are the remaining UTC-normalised calendar days.',
        ],
        assumptions: 'For a 29 February birth, anniversaries fall on 28 February in non-leap years.',
      }),
    },
    {
      id: 'time-days', before: 'You have completed ', numeric: summary.completedDays,
      formatter: (value) => formatExact(Math.round(value)), after: ' whole days.',
      classification: 'Exact', note: 'UTC day numbers keep daylight-saving changes from adding or removing a day.',
      fullValue: `${formatExact(summary.completedDays)} days`,
      math: detail({
        title: 'Completed days lived', classification: 'Exact',
        formula: 'completed days = UTC day number(today) − UTC day number(birth date)',
        substitution: `UTC-day(${localIsoDate(state.now)}) − UTC-day(${state.birthDateValue})`,
        result: `${formatExact(summary.completedDays)} completed days`,
        variables: [
          { symbol: 'UTC day number', definition: 'the count of midnight-to-midnight calendar days on a timezone-neutral scale' },
        ],
        conversions: '1 completed day is one calendar interval from midnight to midnight.',
      }),
    },
    {
      id: 'time-hours', before: 'That is approximately ', numeric: Math.floor(elapsedUnits.hours),
      formatter: (value) => formatExact(Math.round(value)), after: ' hours.', classification: subDayClass,
      note: subDayNote, fullValue: `${formatExact(Math.floor(elapsedUnits.hours))} modelled hours`,
      math: detail({
        title: 'Approximate hours lived', classification: subDayClass,
        formula: 'hours ≈ (C + T) ÷ 3,600',
        substitution: `(${formatNumber(completedDaySeconds, { maximumFractionDigits: 3 })} + ${formatNumber(currentDaySeconds, { maximumFractionDigits: 3 })}) ÷ 3,600`,
        result: `${formatExact(Math.floor(elapsedUnits.hours))} hours`,
        variables: [
          { symbol: 'C', definition: 'actual seconds across completed local calendar intervals', value: formatNumber(completedDaySeconds, { maximumFractionDigits: 3 }) },
          { symbol: 'T', definition: 'actual seconds elapsed since the current local midnight', value: formatNumber(currentDaySeconds, { maximumFractionDigits: 3 }) },
        ],
        conversions: ['1 hour = 60 minutes', '1 hour = 3,600 seconds'], assumptions: subDayAssumption,
        uncertainty: 'The true elapsed total can differ by less than 24 hours because this model starts at a date boundary.',
      }),
    },
    {
      id: 'time-minutes', before: 'Or about ', numeric: Math.floor(elapsedUnits.minutes),
      formatter: (value) => formatCompactValue(Math.round(value)), after: ' minutes.', classification: subDayClass,
      note: subDayNote, fullValue: `${formatExact(Math.floor(elapsedUnits.minutes))} minutes`,
      math: detail({
        title: 'Approximate minutes lived', classification: subDayClass,
        formula: 'minutes ≈ (C + T) ÷ 60',
        substitution: `(${formatNumber(completedDaySeconds, { maximumFractionDigits: 3 })} + ${formatNumber(currentDaySeconds, { maximumFractionDigits: 3 })}) ÷ 60`,
        result: `${formatExact(Math.floor(elapsedUnits.minutes))} minutes`,
        variables: [
          { symbol: 'C', definition: 'actual seconds across completed local calendar intervals', value: formatNumber(completedDaySeconds, { maximumFractionDigits: 3 }) },
          { symbol: 'T', definition: 'actual seconds elapsed since the current local midnight', value: formatNumber(currentDaySeconds, { maximumFractionDigits: 3 }) },
        ],
        conversions: ['24 hours/day', '60 minutes/hour'], assumptions: subDayAssumption,
        uncertainty: 'The true elapsed total can differ by less than 1,440 minutes because this model starts at a date boundary.',
      }),
    },
    {
      id: 'time-seconds', before: 'And roughly ', numeric: Math.floor(elapsedUnits.seconds),
      formatter: (value) => formatExact(Math.floor(value)), after: ' seconds, and counting.', classification: subDayClass,
      note: 'This live model advances once per second. It is still Estimated because the entered date is treated as beginning at midnight.',
      fullValue: `${formatExact(Math.floor(elapsedUnits.seconds))} seconds`,
      live: true,
      math: detail({
        title: 'Live approximate seconds lived', classification: subDayClass,
        formula: 'seconds ≈ C + T',
        substitution: `${formatNumber(completedDaySeconds, { maximumFractionDigits: 3 })} + ${formatNumber(currentDaySeconds, { maximumFractionDigits: 3 })}`,
        result: `${formatExact(Math.floor(elapsedUnits.seconds))} seconds`,
        variables: [
          { symbol: 'C', definition: 'actual seconds across completed local calendar intervals', value: formatNumber(completedDaySeconds, { maximumFractionDigits: 3 }) },
          { symbol: 'T', definition: 'actual seconds elapsed since the current local midnight', value: formatNumber(currentDaySeconds, { maximumFractionDigits: 3 }) },
        ],
        conversions: 'Ordinary days contain 86,400 seconds; daylight-saving changes can make a local day one hour shorter or longer.', assumptions: subDayAssumption,
        uncertainty: 'The true elapsed total can differ by less than 86,400 seconds because this model starts at a date boundary.',
      }),
    },
    {
      id: 'time-weeks', before: 'Your days contain ', numeric: summary.completedWeeks,
      formatter: (value) => formatExact(Math.round(value)), after: ` complete weeks and ${summary.completedDays % 7} extra ${plural(summary.completedDays % 7, 'day')}.`,
      classification: 'Exact', note: 'Integer division separates whole seven-day blocks from the remainder.',
      math: detail({
        title: 'Completed weeks', classification: 'Exact',
        formula: 'days = 7 × whole weeks + remainder',
        substitution: `${formatExact(summary.completedDays)} = 7 × ${formatExact(summary.completedWeeks)} + ${summary.completedDays % 7}`,
        result: `${formatExact(summary.completedWeeks)} complete weeks and ${summary.completedDays % 7} days`,
        variables: { symbol: 'remainder', definition: 'the days left after division by 7' }, conversions: '1 week = 7 days',
      }),
    },
    {
      id: 'time-birthdays', before: 'You have completed ', numeric: summary.birthdays,
      formatter: (value) => formatExact(Math.round(value)), after: ` ${plural(summary.birthdays, 'birthday')}.`, classification: 'Exact',
      note: 'A birthday is counted only after that calendar anniversary has been reached.',
      math: detail({
        title: 'Completed birthdays', classification: 'Exact',
        formula: 'completed birthdays = completed calendar years',
        substitution: `${summary.years} completed calendar years`, result: `${summary.birthdays} completed birthdays`,
        assumptions: 'A 29 February anniversary is treated as 28 February in a non-leap year.',
      }),
    },
    {
      id: 'time-school-days', before: 'A simple Indian school-calendar model gives about ', numeric: schoolDays.total,
      formatter: (value) => formatExact(Math.round(value)), after: ' potential school days.', classification: 'Estimated',
      note: 'This models working days from age six; it is not an attendance record and cannot know local holidays, closures or an individual school calendar.',
      fullValue: `${formatExact(schoolDays.total)} modelled school working days`,
      math: detail({
        title: 'Modelled school days', classification: 'Estimated',
        formula: 'school days ≈ Σ(calendar days in age band ÷ 365.2425 × working days per school year)',
        substitution: schoolDays.segments.length
          ? schoolDays.segments.map((segment) => `${segment.label}: ${formatExact(segment.calendarDays)} ÷ 365.2425 × ${segment.rate}`).join('\n')
          : 'The visitor has not yet reached the model’s age-six starting point.',
        result: `${formatExact(schoolDays.total)} potential school days`,
        variables: schoolDays.segments.map((segment) => `${segment.label}: ${segment.rate} working days/year`),
        conversions: '365.2425 calendar days = 1 mean Gregorian year',
        assumptions: ['School begins at age six.', 'RTE norms of 200 days for Classes I–V and 220 days for VI–VIII are used.', 'A 200-day project assumption is used for ages 14–17, then the model stops at the 18th birthday.', 'Attendance, pandemic closures, school transfers and local calendars are unknown.'],
        uncertainty: 'Potentially hundreds of days for an individual visitor; this is a timetable model, not a historical record.',
        source: INDIA_SCHOOL_DAYS_SOURCE,
      }),
    },
    {
      id: 'time-leap-days', before: 'Your lifetime has included ', numeric: summary.leapDays,
      formatter: (value) => formatExact(Math.round(value)), after: ` leap ${plural(summary.leapDays, 'day')}.`, classification: 'Exact',
      note: 'Only 29 February dates inside the completed-day interval are counted.',
      math: detail({
        title: 'Leap days experienced', classification: 'Exact',
        formula: 'count years divisible by 4, except centuries not divisible by 400, whose 29 February lies in [birth, today)',
        substitution: `${state.birthDateValue} ≤ 29 February < ${localIsoDate(state.now)}`,
        result: `${summary.leapDays} leap days`,
        variables: '[birth, today) includes the birth date and excludes the still-in-progress current date.',
      }),
    },
    {
      id: 'time-weekends', before: 'You have reached ', numeric: weekendPeriods,
      formatter: (value) => formatExact(Math.round(value)), after: ` weekend ${plural(weekendPeriods, 'period')}.`, classification: 'Exact',
      note: `Defined as each Saturday-started weekend, plus an initial partial Sunday if applicable; together they contain ${formatExact(weekendDays)} completed weekend days.`,
      math: detail({
        title: 'Weekends experienced', classification: 'Exact',
        formula: 'weekend periods = Saturdays in [birth, today) + initial partial Sunday',
        substitution: `${formatExact(summary.weekdays.Saturday)} Saturdays + ${weekendPeriods - summary.weekdays.Saturday} initial partial weekend`,
        result: `${formatExact(weekendPeriods)} weekend periods (${formatExact(weekendDays)} weekend days)`,
        variables: ['Saturday starts a weekend period.', 'An initial Sunday counts if the birth date itself was Sunday.'],
      }),
    },
    {
      id: 'time-mondays', before: 'You have made it through ', numeric: summary.Mondays,
      formatter: (value) => formatExact(Math.round(value)), after: ' Mondays.', classification: 'Exact',
      note: 'Weekdays are counted over completed calendar dates, including the birth date and excluding today.',
      math: detail({
        title: 'Mondays experienced', classification: 'Exact',
        formula: 'Mondays = complete weeks + Monday occurrences in the remaining days',
        substitution: `${formatExact(Math.floor(summary.completedDays / 7))} complete weeks + ${summary.Mondays - Math.floor(summary.completedDays / 7)} remainder occurrence`,
        result: `${formatExact(summary.Mondays)} Mondays`,
        variables: weekdayList,
      }),
    },
    {
      id: 'time-weekdays', before: 'All seven weekdays have left ', value: 'their own pattern', after: ' in your life.',
      classification: 'Exact', note: weekdayList.join(' · '),
      math: detail({
        title: 'Every weekday experienced', classification: 'Exact',
        formula: 'each weekday count = complete weeks + occurrences in the remaining 0–6 days',
        substitution: `${formatExact(summary.completedDays)} = 7 × ${formatExact(Math.floor(summary.completedDays / 7))} + ${summary.completedDays % 7}`,
        result: weekdayList.join('; '), variables: 'The interval includes completed dates [birth date, current date).',
      }),
    },
    {
      id: 'time-century', before: 'You have completed ', numeric: summary.centuryPercent,
      formatter: (value) => formatPercent(value, 3), after: ' of a century.', classification: 'Exact',
      note: 'The denominator is the actual number of calendar days from birth to the 100th birthday.',
      math: detail({
        title: 'Percentage of a century completed', classification: 'Exact',
        formula: 'percentage = completed days ÷ days from birth to 100th birthday × 100',
        substitution: `${formatExact(summary.completedDays)} ÷ ${formatExact(centuryDays)} × 100`,
        result: formatPercent(summary.centuryPercent, 4),
        variables: 'Century length includes its actual leap days rather than assuming 36,500 days.',
      }),
    },
    {
      id: 'time-age-year', before: 'Since your last birthday, you are ', numeric: summary.ageYearPercent,
      formatter: (value) => formatPercent(value, 2), after: ' of the way to the next one.', classification: 'Exact',
      note: 'The current age-year uses its real 365- or 366-day calendar length.',
      math: detail({
        title: 'Progress through the current age-year', classification: 'Exact',
        formula: 'progress = days since last birthday ÷ days between birthdays × 100',
        substitution: 'UTC-normalised dates for the most recent and next anniversaries',
        result: formatPercent(summary.ageYearPercent, 3),
        variables: ['last birthday = most recent calendar anniversary', 'next birthday = following calendar anniversary'],
      }),
    },
    {
      id: 'time-seasons', before: 'By a meteorological calendar, you have experienced ', numeric: seasonCount,
      formatter: (value) => formatExact(Math.round(value)), after: ` ${plural(seasonCount, 'season')}.`, classification: 'Exact',
      note: 'The season already in progress on the birth date counts, followed by every season boundary reached.',
      math: detail({
        title: 'Meteorological seasons experienced', classification: 'Exact',
        formula: 'seasons experienced = initial intersecting season + later season-start dates in [birth, today)',
        substitution: 'Start with the season containing the birth date; then count 1 Mar, 1 Jun, 1 Sep and 1 Dec boundaries reached',
        result: `${seasonCount} seasons experienced`,
        assumptions: 'Meteorological four-season convention; India’s climatic seasons may be described differently.',
      }),
    },
    {
      id: 'time-year-fraction', before: summary.completedDays ? 'Your lifetime divides exactly across ' : 'Calendar-year fractions are ',
      ...(summary.completedDays
        ? { numeric: yearSlices.length, formatter: (value) => formatExact(Math.round(value)) }
        : { value: 'not yet defined' }),
      after: summary.completedDays ? ` calendar-year ${plural(yearSlices.length, 'slice')}.` : ' with zero completed days.', classification: 'Exact',
      note: summary.completedDays ? 'Expand the full value to see the exact fraction and percentage held by every calendar year.' : 'The fractions require at least one completed day.',
      fullValue: summary.completedDays ? yearSliceText : undefined,
      math: detail({
        title: 'Fraction of life spent in each calendar year', classification: 'Exact',
        formula: 'share in year Y = completed lifetime days inside Y ÷ total completed lifetime days × 100',
        substitution: summary.completedDays ? yearSliceText : '0 ÷ 0 is undefined',
        result: summary.completedDays ? yearSliceText : 'Undefined until at least one day is completed',
        variables: yearSlices.map(({ year, days }) => `${year}: ${formatExact(days)} completed days in that calendar year`),
        assumptions: 'Uses the completed-day interval [birth date, current date); today’s unfinished date is excluded.',
        uncertainty: 'None; each slice is exact calendar-day arithmetic. Display percentages are rounded, while the fractions remain exact.',
      }),
    },
    {
      id: 'time-planets', before: 'On Mercury you are ', value: `${formatNumber(planetary.Mercury, { maximumFractionDigits: 1 })} years old; on Jupiter, ${formatNumber(planetary.Jupiter, { maximumFractionDigits: 2 })}`,
      after: '.', classification: 'Estimated',
      note: `Venus ${formatNumber(planetary.Venus, { maximumFractionDigits: 1 })} · Mars ${formatNumber(planetary.Mars, { maximumFractionDigits: 2 })} · Saturn ${formatNumber(planetary.Saturn, { maximumFractionDigits: 2 })} · Neptune ${formatNumber(planetary.Neptune, { maximumFractionDigits: 3 })}`,
      math: detail({
        title: 'Age in planetary years', classification: 'Estimated',
        formula: 'planetary years = Earth age in days ÷ planet’s mean orbital period in Earth days',
        substitution: Object.entries(PLANET_PERIODS).map(([planet, period]) => `${planet}: ${formatExact(summary.completedDays)} ÷ ${formatNumber(period, { maximumFractionDigits: 3 })}`).join('\n'),
        result: Object.entries(planetary).map(([planet, value]) => `${planet}: ${formatNumber(value, { maximumFractionDigits: 3 })} years`).join('; '),
        variables: { symbol: 'orbital period', definition: 'mean time a planet takes to orbit the Sun' },
        assumptions: 'Mean orbital periods and completed Earth days are used; planetary orbits are not perfectly uniform.',
        uncertainty: 'Small relative uncertainty from rounded mean orbital periods and the current partial day.',
        source: NASA_PLANET_SOURCE,
      }),
    },
  ];
}

function renderWeekdayVisual() {
  const values = WEEKDAY_NAMES.map((day) => state.timeSummary.weekdays[day]);
  const maximum = Math.max(...values, 1);
  dom.weekdayVisual.replaceChildren();
  WEEKDAY_NAMES.forEach((day) => {
    const count = state.timeSummary.weekdays[day];
    const bar = createElement('div', 'weekday-bar');
    const fill = createElement('div', 'weekday-bar__fill');
    fill.style.height = `${Math.max(3, count / maximum * 100)}%`;
    bar.append(fill, createElement('strong', '', formatExact(count)), createElement('span', '', day.slice(0, 3)));
    dom.weekdayVisual.append(bar);
  });
}

function buildBodyStats(body) {
  const a = body.assumptions;
  const live = calculateLiveBodyCounters(body, state.elapsed);
  const liveMinutes = state.elapsed.minutes;
  const completedAwakeMinutes = body.awakeMinutes;
  const currentDayProgress = state.elapsed.currentDayProgress;
  const sleepSegments = body.sleepModel.segments.map((segment) => (
    `${segment.label}: ${formatNumber(segment.days, { maximumFractionDigits: 1 })} days × ${segment.hoursPerDay} h/day = ${formatExact(Math.round(segment.hours))} h`
  ));
  const sleepIsPiecewise = body.sleepModel.model === 'piecewise-age-bands';
  const hairMetres = body.hairGrowthMillimetres / 1_000;
  const nailCentimetres = body.fingernailGrowthMillimetres / 10;
  const glasses = body.waterLitres / 0.25;

  return [
    {
      id: 'body-heartbeats', before: 'Your heart has beaten approximately ', numeric: live.heartbeats,
      formatter: (value) => formatExact(Math.floor(value)), after: ' times, and counting.', classification: 'Estimated',
      note: `Live model: ${a.heartRateBpm} beats per minute. Real heart rate changes continuously.`,
      fullValue: `${formatExact(Math.floor(live.heartbeats))} estimated heartbeats`,
      live: true,
      math: detail({
        title: 'Estimated heartbeats', classification: 'Estimated',
        formula: 'heartbeats = M × r',
        substitution: `${formatNumber(liveMinutes, { maximumFractionDigits: 4 })} × ${a.heartRateBpm}`,
        result: `${formatExact(Math.floor(live.heartbeats))} estimated heartbeats`,
        variables: [
          { symbol: 'M', definition: 'live date-based elapsed minutes', value: formatNumber(liveMinutes, { maximumFractionDigits: 4 }) },
          { symbol: 'r', definition: 'assumed average heart rate', value: `${a.heartRateBpm} beats/minute` },
        ],
        conversions: 'M = live elapsed seconds ÷ 60',
        assumptions: [`A lifetime average of ${a.heartRateBpm} beats per minute; the rate is adjustable in the Estimate Lab.`, 'The entered date is modelled as beginning at midnight.'],
        uncertainty: 'The live total inherits the uncertainty of the assumed lifetime rate and can differ greatly from a personal measurement.', source: BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-blood', before: 'At the modelled rate, your heart has moved ', numeric: live.bloodPumpedLitres,
      formatter: (value) => formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), after: ' litres of blood, and counting.', classification: 'Estimated',
      note: `Live model: ${a.cardiacOutputLitresPerMinute} litres per minute, spread uniformly across the lifetime.`,
      fullValue: `${formatNumber(live.bloodPumpedLitres, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} estimated litres`,
      live: true,
      math: detail({
        title: 'Estimated blood pumped', classification: 'Estimated',
        formula: 'blood volume = M × c',
        substitution: `${formatNumber(liveMinutes, { maximumFractionDigits: 4 })} × ${a.cardiacOutputLitresPerMinute} L/min`,
        result: `${formatNumber(live.bloodPumpedLitres, { maximumFractionDigits: 2 })} litres`,
        variables: [
          { symbol: 'M', definition: 'live date-based elapsed minutes', value: formatNumber(liveMinutes, { maximumFractionDigits: 4 }) },
          { symbol: 'c', definition: 'assumed average cardiac output', value: `${a.cardiacOutputLitresPerMinute} L/min` },
        ],
        conversions: ['M = live elapsed seconds ÷ 60', '1,000 litres = 1 cubic metre'],
        assumptions: ['A constant lifetime average is a simplified educational model; activity, age and health all change the real rate.', 'The entered date is modelled as beginning at midnight.'],
        uncertainty: 'The live total inherits the uncertainty of the assumed cardiac-output rate.', source: BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-breaths', before: 'You have taken roughly ', numeric: live.breaths,
      formatter: (value) => formatExact(Math.floor(value)), after: ' breaths, and counting.', classification: 'Estimated',
      note: `Live model: ${a.breathsPerMinute} breaths per minute across the whole lifetime.`,
      fullValue: `${formatExact(Math.floor(live.breaths))} estimated breaths`,
      live: true,
      math: detail({
        title: 'Estimated breaths', classification: 'Estimated',
        formula: 'breaths = M × b',
        substitution: `${formatNumber(liveMinutes, { maximumFractionDigits: 4 })} × ${a.breathsPerMinute}`,
        result: `${formatExact(Math.floor(live.breaths))} breaths`,
        variables: [
          { symbol: 'M', definition: 'live date-based elapsed minutes', value: formatNumber(liveMinutes, { maximumFractionDigits: 4 }) },
          { symbol: 'b', definition: 'assumed breathing rate', value: `${a.breathsPerMinute} breaths/minute` },
        ],
        conversions: 'M = live elapsed seconds ÷ 60',
        assumptions: ['Breathing changes with sleep, exercise, emotion and age; this is not a measurement.', 'The entered date is modelled as beginning at midnight.'],
        uncertainty: 'The live total inherits the uncertainty of the assumed breathing rate.', source: BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-blinks', before: 'While awake, you may have blinked about ', numeric: live.blinks,
      formatter: (value) => formatExact(Math.floor(value)), after: ' times, and counting.', classification: 'Estimated',
      note: `Live model: ${a.blinksPerAwakeMinute} blinks per awake minute, distributed using the modelled awake fraction.`,
      fullValue: `${formatExact(Math.floor(live.blinks))} estimated waking blinks`,
      live: true,
      math: detail({
        title: 'Estimated blinks while awake', classification: 'Estimated',
        formula: 'blinks = (A + p × Aᵈ) × b',
        substitution: `(${formatNumber(completedAwakeMinutes, { maximumFractionDigits: 4 })} + ${formatNumber(currentDayProgress, { maximumFractionDigits: 6 })} × ${formatNumber(live.marginalAwakeMinutes, { maximumFractionDigits: 4 })}) × ${a.blinksPerAwakeMinute}`,
        result: `${formatExact(Math.floor(live.blinks))} blinks`,
        variables: [
          { symbol: 'A', definition: 'modelled awake minutes across completed days', value: formatNumber(completedAwakeMinutes, { maximumFractionDigits: 4 }) },
          { symbol: 'p', definition: 'fraction of the current local day elapsed', value: formatNumber(currentDayProgress, { maximumFractionDigits: 6 }) },
          { symbol: 'Aᵈ', definition: 'modelled awake minutes assigned to the current age day', value: formatNumber(live.marginalAwakeMinutes, { maximumFractionDigits: 4 }) },
          { symbol: 'b', definition: 'assumed blinks per waking minute', value: a.blinksPerAwakeMinute },
        ],
        conversions: '60 minutes/hour',
        assumptions: ['Blinking varies greatly with reading, screens, air conditions, sleep and attention.', 'Because current sleep state is unknown, today’s modelled awake activity is spread uniformly through time.'],
        uncertainty: 'The live total inherits uncertainty from both the sleep model and blink-rate assumption.', source: [BIOLOGY_MODEL_SOURCE, SLEEP_MODEL_SOURCE],
      }),
    },
    {
      id: 'body-sleep', before: 'You have spent an estimated ', numeric: body.sleepHours,
      formatter: (value) => formatCompactValue(Math.round(value)), after: ' hours asleep.', classification: 'Estimated',
      note: sleepIsPiecewise
        ? 'Unlike a single-rate model, this adds recommended sleep midpoints across age bands.'
        : `The Estimate Lab currently replaces the age bands with ${a.sleepHoursPerDay} hours per day.`,
      fullValue: `${formatExact(Math.round(body.sleepHours))} hours (${formatNumber(body.sleepHours / 24, { maximumFractionDigits: 1 })} days)`,
      math: detail({
        title: 'Modelled time asleep', classification: 'Estimated',
        formula: sleepIsPiecewise
          ? 'sleep hours = Σ(days lived in age band × midpoint sleep hours/day)'
          : 'sleep hours = completed days × visitor-selected hours/day',
        substitution: sleepSegments.join('\n'),
        result: `${formatExact(Math.round(body.sleepHours))} modelled sleep hours`,
        variables: sleepSegments,
        conversions: '24 sleep hours = 1 day',
        assumptions: sleepIsPiecewise
          ? 'Midpoints of recommended ranges are used, and fractional age bands use a mean year of 365.2425 days.'
          : 'A single visitor-selected average replaces the documented age-banded default.',
        uncertainty: uncertaintyText(body.ranges.sleepHours, 'hours'),
        source: sleepIsPiecewise ? SLEEP_MODEL_SOURCE : BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-red-cells', before: 'Your bone marrow may have produced around ', numeric: body.redBloodCellsProduced,
      formatter: (value) => formatCompactValue(Math.round(value)), after: ' red blood cells.', classification: 'Estimated',
      note: `The model assumes ${formatCompactValue(a.redBloodCellsPerSecond)} cells produced per second.`,
      fullValue: `${formatExact(Math.round(body.redBloodCellsProduced))} estimated cells`,
      math: detail({
        title: 'Estimated red blood cells produced', classification: 'Estimated',
        formula: 'cells = completed days × 86,400 seconds/day × cells produced/second',
        substitution: `${formatExact(state.ageDays)} × 86,400 × ${formatExact(a.redBloodCellsPerSecond)}`,
        result: `${formatScientific(body.redBloodCellsProduced, 4)} cells`,
        variables: { symbol: 'production rate', definition: 'rounded educational average', value: `${formatExact(a.redBloodCellsPerSecond)} cells/second` },
        conversions: '1 day = 86,400 seconds',
        assumptions: 'Cell production changes with physiology and age. This is not a blood test or medical reading.',
        uncertainty: uncertaintyText(body.ranges.redBloodCellsProduced, 'cells'), source: BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-hair', before: 'An individual scalp hair could have grown a total of about ', numeric: hairMetres,
      formatter: (value) => `${formatNumber(value, { maximumFractionDigits: 2 })} m`, after: ' if it were never cut.', classification: 'Estimated',
      note: `The model uses ${a.hairGrowthMillimetresPerDay} mm per day; real growth occurs in cycles and differs among hairs.`,
      fullValue: `${formatNumber(body.hairGrowthMillimetres, { maximumFractionDigits: 1 })} millimetres`,
      math: detail({
        title: 'Estimated hair growth', classification: 'Estimated',
        formula: 'growth = completed days × millimetres grown per day',
        substitution: `${formatExact(state.ageDays)} × ${a.hairGrowthMillimetresPerDay} mm/day`,
        result: `${formatNumber(body.hairGrowthMillimetres, { maximumFractionDigits: 1 })} mm = ${formatNumber(hairMetres, { maximumFractionDigits: 3 })} m`,
        variables: { symbol: 'growth rate', definition: 'assumed average for one growing scalp hair', value: `${a.hairGrowthMillimetresPerDay} mm/day` },
        conversions: '1,000 mm = 1 m',
        assumptions: 'A hypothetical continuously growing, never-cut hair; shedding and resting phases are ignored.',
        uncertainty: uncertaintyText(body.ranges.hairGrowthMillimetres, 'mm'), source: BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-nails', before: 'Each fingernail could have added roughly ', numeric: nailCentimetres,
      formatter: (value) => `${formatNumber(value, { maximumFractionDigits: 1 })} cm`, after: ' of growth.', classification: 'Estimated',
      note: `The rate assumption is ${a.fingernailGrowthMillimetresPerDay} mm per day, before trimming.`,
      fullValue: `${formatNumber(body.fingernailGrowthMillimetres, { maximumFractionDigits: 1 })} millimetres`,
      math: detail({
        title: 'Estimated fingernail growth', classification: 'Estimated',
        formula: 'growth = completed days × nail growth per day',
        substitution: `${formatExact(state.ageDays)} × ${a.fingernailGrowthMillimetresPerDay} mm/day`,
        result: `${formatNumber(body.fingernailGrowthMillimetres, { maximumFractionDigits: 1 })} mm = ${formatNumber(nailCentimetres, { maximumFractionDigits: 1 })} cm`,
        variables: { symbol: 'growth rate', definition: 'assumed average for one fingernail', value: `${a.fingernailGrowthMillimetresPerDay} mm/day` },
        conversions: '10 mm = 1 cm', assumptions: 'A constant average before clipping; fingers and people vary.',
        uncertainty: uncertaintyText(body.ranges.fingernailGrowthMillimetres, 'mm'), source: BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-steps', before: 'At the modelled daily rate, you have taken ', numeric: body.steps,
      formatter: (value) => formatCompactValue(Math.round(value)), after: ' steps.', classification: 'Estimated',
      note: `The adjustable default is ${formatExact(a.stepsPerDay)} steps per day across the entire lifetime.`,
      fullValue: `${formatExact(Math.round(body.steps))} estimated steps`,
      math: detail({
        title: 'Estimated steps walked', classification: 'Estimated',
        formula: 'steps = completed days × average steps per day',
        substitution: `${formatExact(state.ageDays)} × ${formatExact(a.stepsPerDay)}`,
        result: `${formatExact(Math.round(body.steps))} steps`,
        variables: { symbol: 'daily steps', definition: 'visitor-adjustable lifetime average', value: formatExact(a.stepsPerDay) },
        assumptions: 'Infancy, illness, travel and day-to-day activity are compressed into one average.',
        uncertainty: uncertaintyText(body.ranges.steps, 'steps'), source: BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-distance', before: 'Those steps correspond to approximately ', numeric: body.distanceWalkedKilometres,
      formatter: (value) => formatDistanceKilometres(value), after: ' walked.', classification: 'Estimated',
      note: `Each step is modelled as ${a.stepLengthMetres} metres long.`,
      fullValue: `${formatNumber(body.distanceWalkedKilometres, { maximumFractionDigits: 1 })} kilometres`,
      math: detail({
        title: 'Estimated walking distance', classification: 'Estimated',
        formula: 'distance (km) = days × steps/day × metres/step ÷ 1,000',
        substitution: `${formatExact(state.ageDays)} × ${formatExact(a.stepsPerDay)} × ${a.stepLengthMetres} ÷ 1,000`,
        result: `${formatNumber(body.distanceWalkedKilometres, { maximumFractionDigits: 2 })} km`,
        variables: [
          { symbol: 'steps/day', definition: 'visitor-adjustable average', value: a.stepsPerDay },
          { symbol: 'step length', definition: 'visitor-adjustable average', value: `${a.stepLengthMetres} m` },
        ],
        conversions: '1,000 metres = 1 kilometre',
        assumptions: 'A constant daily step count and step length are used from birth onward.',
        uncertainty: uncertaintyText(body.ranges.distanceWalkedKilometres, 'km', (value) => formatNumber(value, { maximumFractionDigits: 0 })), source: BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-meals', before: 'A three-meal model gives about ', numeric: body.meals,
      formatter: (value) => formatCompactValue(Math.round(value)), after: ' meals eaten.', classification: 'Estimated',
      note: 'Snacks are excluded, and early infancy makes this a deliberately simple lifetime average.',
      fullValue: `${formatExact(Math.round(body.meals))} estimated meals`,
      math: detail({
        title: 'Estimated meals eaten', classification: 'Estimated',
        formula: 'meals = completed days × meals per day',
        substitution: `${formatExact(state.ageDays)} × ${a.mealsPerDay}`, result: `${formatExact(Math.round(body.meals))} meals`,
        variables: { symbol: 'meal rate', definition: 'assumed daily average', value: `${a.mealsPerDay}/day` },
        assumptions: 'Three meals every day from birth is a simplified model; feeding patterns and skipped meals vary.',
        uncertainty: uncertaintyText(body.ranges.meals, 'meals'), source: BIOLOGY_MODEL_SOURCE,
      }),
    },
    {
      id: 'body-water', before: 'You may have consumed around ', numeric: body.waterLitres,
      formatter: (value) => `${formatCompactValue(Math.round(value))} L`, after: ' of water.', classification: 'Estimated',
      note: `At 250 mL per glass, that is about ${formatCompactValue(glasses)} glasses; the adjustable rate is ${a.waterLitresPerDay} L/day.`,
      fullValue: `${formatNumber(body.waterLitres, { maximumFractionDigits: 1 })} litres; ${formatExact(Math.round(glasses))} modelled 250 mL glasses`,
      math: detail({
        title: 'Estimated water consumed', classification: 'Estimated',
        formula: 'water = completed days × litres per day',
        substitution: `${formatExact(state.ageDays)} × ${a.waterLitresPerDay} L/day`,
        result: `${formatNumber(body.waterLitres, { maximumFractionDigits: 1 })} L ≈ ${formatExact(Math.round(glasses))} glasses`,
        variables: { symbol: 'daily water', definition: 'visitor-adjustable model rate', value: `${a.waterLitresPerDay} L/day` },
        conversions: '1 modelled glass = 0.25 L = 250 mL',
        assumptions: 'The model counts a constant quantity of water and does not distinguish water in food or other drinks.',
        uncertainty: uncertaintyText(body.ranges.waterLitres, 'litres'), source: BIOLOGY_MODEL_SOURCE,
      }),
    },
  ];
}

function greatestCommonDivisor(a, b) {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function compareParts(first, second) {
  if (first.year !== second.year) return first.year - second.year;
  if (first.month !== second.month) return first.month - second.month;
  return first.day - second.day;
}

function logarithmicScaleForSeconds(seconds) {
  if (!(seconds > 0)) return '';
  return [
    ['seconds', seconds],
    ['minutes', seconds / 60],
    ['hours', seconds / 3_600],
    ['days', seconds / 86_400],
    ['years', seconds / (86_400 * 365.2425)],
    ['decades', seconds / (86_400 * 365.2425 * 10)],
  ]
    .map(([unit, value]) => `${unit}: ${formatNumber(value, { maximumFractionDigits: 3 })} = 10^${formatNumber(Math.log10(value), { maximumFractionDigits: 3 })}`)
    .join('\n');
}

function buildFingerprintStats() {
  const n = state.ageDays;
  const p = state.numberProperties;
  const factorList = n > 0 ? divisors(n) : [];
  const exponentProduct = p.factorization.map(({ exponent }) => `(${exponent} + 1)`).join(' × ') || 'not defined';
  const centuryTarget = {
    year: state.birth.year + 100,
    month: state.birth.month,
    day: state.birth.day,
  };
  if (centuryTarget.month === 2 && centuryTarget.day === 29) {
    const isTargetLeap = centuryTarget.year % 4 === 0 && (centuryTarget.year % 100 !== 0 || centuryTarget.year % 400 === 0);
    if (!isTargetLeap) centuryTarget.day = 28;
  }
  const centuryDays = differenceInCalendarDays(state.birth, centuryTarget);
  const fractionDivisor = greatestCommonDivisor(n, centuryDays);
  const fractionText = `${formatExact(n / fractionDivisor)}/${formatExact(centuryDays / fractionDivisor)}`;
  const daysToTenThousand = 10_000 - n;
  const birthDigits = state.birthDateValue.replaceAll('-', '');
  const arrangements = countDistinctArrangements(birthDigits);
  const digitCounts = [...birthDigits].reduce((counts, digit) => {
    counts[digit] = (counts[digit] || 0) + 1;
    return counts;
  }, {});
  const denominator = Object.values(digitCounts).filter((count) => count > 1).map((count) => `${count}!`).join(' × ') || '1';
  const bornBeforeCovidBoundary = compareParts(state.birth, COVID_BOUNDARY) < 0;
  const beforeCovidDays = bornBeforeCovidBoundary
    ? Math.min(n, safeDaysBetween(state.birth, COVID_BOUNDARY))
    : 0;
  const afterCovidDays = Math.max(0, n - beforeCovidDays);
  const beforeCovidPercent = n ? beforeCovidDays / n * 100 : 0;
  const afterCovidPercent = n ? afterCovidDays / n * 100 : 0;
  const seconds = Math.max(0, Math.floor(state.elapsed.seconds));
  const logSeconds = seconds > 0 ? Math.log10(seconds) : null;
  const logarithmicScaleText = logarithmicScaleForSeconds(seconds);
  const scientificAge = formatScientific(n, Math.max(1, String(Math.max(1, n)).length));
  const classification = p.prime ? 'prime' : p.composite ? 'composite' : 'neither prime nor composite';
  const traits = [
    `${p.parity}`,
    `${p.palindrome ? 'a' : 'not a'} palindrome`,
    `${p.triangular ? 'a' : 'not a'} triangular number`,
    `${p.perfectSquare ? 'a' : 'not a'} perfect square`,
    `${p.fibonacci ? 'a' : 'not a'} Fibonacci number`,
  ];

  return [
    {
      id: 'fingerprint-decimal', before: 'Your mathematical fingerprint begins with ', numeric: n,
      formatter: (value) => formatExact(Math.round(value)), after: '.', classification: 'Exact',
      note: 'This is your number of completed days in ordinary base ten.',
      math: detail({
        title: 'Age in decimal days', classification: 'Exact', formula: 'N = completed calendar days lived',
        substitution: `N = UTC-day(${localIsoDate(state.now)}) − UTC-day(${state.birthDateValue})`,
        result: `N = ${formatExact(n)}`, variables: { symbol: 'N', definition: 'completed age in days', value: formatExact(n) },
      }),
    },
    {
      id: 'fingerprint-representations', before: 'In binary, the same age is ', value: p.binary, after: '.', classification: 'Exact',
      note: `Hexadecimal: ${p.hexadecimal} · Roman: ${p.roman || 'outside the standard 1–3,999 range'} · Scientific: ${scientificAge}`,
      math: detail({
        title: 'Age in other number systems', classification: 'Exact',
        formula: 'binary uses powers of 2; hexadecimal uses powers of 16; scientific notation uses a × 10ᵏ',
        substitution: `${formatExact(n)}₁₀ → base 2, base 16${p.roman ? ', Roman numerals' : ''}, scientific notation`,
        result: `binary ${p.binary}; hexadecimal ${p.hexadecimal}; Roman ${p.roman || 'not represented'}; scientific ${scientificAge}`,
        variables: [
          { symbol: 'base', definition: 'the number of digit symbols available before a new place value begins' },
          { symbol: 'k', definition: 'power of ten in scientific notation' },
        ],
        assumptions: 'Standard Roman numeral output is deliberately limited to positive integers from 1 to 3,999.',
      }),
    },
    {
      id: 'fingerprint-prime', before: `${formatExact(n)} is `, value: classification, after: '.', classification: 'Exact',
      note: p.prime ? 'It has exactly two positive factors: 1 and itself.' : p.composite ? 'It has more than two positive factors.' : 'By definition, 0 and 1 are neither prime nor composite.',
      math: detail({
        title: 'Prime or composite status', classification: 'Exact',
        formula: 'test divisibility by every integer d from 2 through ⌊√N⌋',
        substitution: `N = ${formatExact(n)}; ⌊√N⌋ = ${formatExact(Math.floor(Math.sqrt(n)))}`,
        result: `${formatExact(n)} is ${classification}`,
        variables: { symbol: 'd', definition: 'a possible divisor' },
        assumptions: 'Prime numbers are integers greater than 1 with exactly two positive divisors.',
      }),
    },
    {
      id: 'fingerprint-factors', before: 'Its complete prime factorisation is ', value: p.factorizationText, after: '.', classification: 'Exact',
      note: n > 1 ? 'Multiplying these prime powers returns the original age in days.' : 'Prime factorisation is not defined for zero; one has an empty prime product.',
      math: detail({
        title: 'Prime factorisation', classification: 'Exact',
        formula: 'repeatedly divide N by the smallest prime divisor until the quotient is 1',
        substitution: n > 1 ? `${formatExact(n)} ÷ successive prime divisors` : `N = ${n}`,
        result: `${formatExact(n)} = ${p.factorizationText}`,
        variables: p.factorization.map(({ prime, exponent }) => `${prime} appears ${exponent} ${plural(exponent, 'time')}`),
      }),
    },
    {
      id: 'fingerprint-divisors', before: 'It has ', value: p.factorCount == null ? 'no finite divisor count' : `${formatExact(p.factorCount)} positive factors`, after: '.', classification: 'Exact',
      note: p.factorSum == null ? 'The positive divisors of zero are not a finite set.' : `Those factors add to ${formatExact(p.factorSum)}.`,
      math: detail({
        title: 'Number and sum of factors', classification: 'Exact',
        formula: 'if N = ∏pᵉ, factor count = ∏(e + 1); factor sum = sum of all positive divisors',
        substitution: p.factorCount == null ? 'N = 0: every positive integer divides 0' : `count: ${exponentProduct}; divisors: ${factorList.join(' + ')}`,
        result: p.factorCount == null ? 'No finite count or sum' : `${p.factorCount} factors; sum = ${formatExact(p.factorSum)}`,
        variables: { symbol: 'e', definition: 'an exponent in the prime factorisation' },
      }),
    },
    {
      id: 'fingerprint-traits', before: 'As a number, it is ', value: traits.join(', '), after: '.', classification: 'Exact',
      note: `Its digital root is ${p.digitalRoot}. Each property is tested independently.`,
      math: detail({
        title: 'Number-property tests', classification: 'Exact',
        formula: [
          'even ⇔ N mod 2 = 0',
          'palindrome ⇔ digits(N) = reverse(digits(N))',
          'triangular ⇔ 8N + 1 is a square',
          'square ⇔ ⌊√N⌋² = N',
          'Fibonacci ⇔ 5N² + 4 or 5N² − 4 is a square',
          'digital root = 1 + ((N − 1) mod 9), for N > 0',
        ].join('\n'),
        substitution: `N = ${formatExact(n)}; 8N + 1 = ${formatExact(8 * n + 1)}; 5N² ± 4 = ${formatExact(5 * n * n + 4)} or ${formatExact(5 * n * n - 4)}`,
        result: `${traits.join('; ')}; digital root ${p.digitalRoot}`,
        variables: { symbol: 'mod', definition: 'remainder after integer division' },
      }),
    },
    {
      id: 'fingerprint-next-prime', before: 'Your next prime-number age is ', numeric: p.nextPrime,
      formatter: (value) => formatExact(Math.round(value)), after: ` days—${formatExact(p.nextPrime - n)} ${plural(p.nextPrime - n, 'day')} away.`, classification: 'Exact',
      note: 'Every integer after the current age is tested until one has no divisor up to its square root.',
      math: detail({
        title: 'Next prime-number age', classification: 'Exact',
        formula: 'smallest integer P > N for which no d in [2, ⌊√P⌋] divides P',
        substitution: `test ${n + 1}, ${n + 2}, …`, result: `${formatExact(p.nextPrime)} days (${formatExact(p.nextPrime - n)} days from now)`,
        variables: [{ symbol: 'N', definition: 'current completed age', value: n }, { symbol: 'P', definition: 'next prime age', value: p.nextPrime }],
      }),
    },
    {
      id: 'fingerprint-palindromes', before: 'Your neighbouring palindromic ages are ', value: `${p.previousPalindrome == null ? 'none yet' : formatExact(p.previousPalindrome)} and ${formatExact(p.nextPalindrome)}`, after: ' days.', classification: 'Exact',
      note: `The next one arrives in ${formatExact(p.nextPalindrome - n)} days; a palindrome reads the same forwards and backwards.`,
      math: detail({
        title: 'Previous and next palindromic ages', classification: 'Exact',
        formula: 'search downward and upward until decimal digits equal their reversal',
        substitution: `${p.previousPalindrome == null ? 'No non-negative palindrome lies below 0' : `reverse(${p.previousPalindrome}) = ${p.previousPalindrome}`}; reverse(${p.nextPalindrome}) = ${p.nextPalindrome}`,
        result: `previous ${p.previousPalindrome == null ? 'none' : formatExact(p.previousPalindrome)}; next ${formatExact(p.nextPalindrome)} days`,
        variables: { symbol: 'reverse(N)', definition: 'the decimal digits of N written in reverse order' },
      }),
    },
    {
      id: 'fingerprint-ten-thousand',
      before: daysToTenThousand >= 0 ? 'Your 10,000-day milestone is ' : 'You passed 10,000 days ',
      numeric: Math.abs(daysToTenThousand), formatter: (value) => formatExact(Math.round(value)),
      after: daysToTenThousand >= 0 ? ` ${plural(daysToTenThousand, 'day')} away.` : ` ${plural(Math.abs(daysToTenThousand), 'day')} ago.`,
      classification: 'Exact', note: 'This is simple subtraction on completed-day ages.',
      math: detail({
        title: 'Distance from the 10,000-day milestone', classification: 'Exact',
        formula: 'days remaining = 10,000 − current completed days',
        substitution: `10,000 − ${formatExact(n)}`, result: `${formatExact(daysToTenThousand)} days remaining`,
        variables: { symbol: 'N', definition: 'current completed age in days', value: n },
      }),
    },
    {
      id: 'fingerprint-century-fraction', before: 'As a fraction of the road to age 100, you are at ', value: fractionText, after: '.', classification: 'Exact',
      note: `That is ${formatPercent(state.timeSummary.centuryPercent, 3)}, reduced from ${formatExact(n)}/${formatExact(centuryDays)} calendar days.`,
      math: detail({
        title: 'Age as a fraction of 100 calendar years', classification: 'Exact',
        formula: 'fraction = completed days / days from birth to 100th birthday; divide both by their greatest common divisor',
        substitution: `${formatExact(n)}/${formatExact(centuryDays)} ÷ ${formatExact(fractionDivisor)}/${formatExact(fractionDivisor)}`,
        result: fractionText, variables: { symbol: 'GCD', definition: 'greatest common divisor', value: fractionDivisor },
      }),
    },
    {
      id: 'fingerprint-date-arrangements', before: 'The eight digits of your birth date have ', numeric: arrangements,
      formatter: (value) => formatExact(Math.round(value)), after: ' distinct arrangements.', classification: 'Exact',
      note: `The calculation uses YYYYMMDD: ${birthDigits}. Repeated digits reduce the count.`,
      math: detail({
        title: 'Distinct birth-date digit arrangements', classification: 'Exact',
        formula: 'arrangements = 8! ÷ (product of each repeated digit’s factorial)',
        substitution: `8! ÷ (${denominator})`, result: `${formatExact(arrangements)} distinct arrangements`,
        variables: Object.entries(digitCounts).map(([digit, count]) => `digit ${digit} occurs ${count} ${plural(count, 'time')}`),
        assumptions: 'Leading zeroes are retained as digits; arrangements do not all represent valid dates.',
      }),
    },
    {
      id: 'fingerprint-covid',
      before: n ? 'By 11 March 2020, ' : 'The before-and-after COVID calculation needs ',
      ...(n
        ? { numeric: beforeCovidPercent, formatter: (value) => formatPercent(value, 1) }
        : { value: 'at least one completed day' }),
      after: n ? ` of your completed lifetime lay before the WHO pandemic declaration; ${formatPercent(afterCovidPercent, 1)} lay after it.` : '.',
      classification: 'Exact', note: n ? 'This is exact calendar arithmetic around a clearly stated historical boundary, not a claim about when COVID-19 began.' : 'A percentage with zero completed days would require division by zero, so the honest result is undefined.',
      math: detail({
        title: 'Lifetime before and after the WHO pandemic declaration', classification: 'Exact',
        formula: 'share before = days from birth to boundary ÷ total completed days × 100; share after = 100 − share before',
        substitution: n ? `${formatExact(beforeCovidDays)} ÷ ${formatExact(n)} × 100; ${formatExact(afterCovidDays)} ÷ ${formatExact(n)} × 100` : '0 ÷ 0 is undefined',
        result: n ? `${formatPercent(beforeCovidPercent, 2)} before; ${formatPercent(afterCovidPercent, 2)} after` : 'Undefined until one full day has been completed',
        variables: { symbol: 'boundary', definition: '11 March 2020, the date WHO characterised COVID-19 as a pandemic' },
        assumptions: 'The named WHO announcement is used as a transparent dividing date.', source: WHO_COVID_SOURCE,
      }),
    },
    {
      id: 'fingerprint-logarithm', before: seconds ? 'Measured in seconds, your lifetime sits near ' : 'At zero completed seconds, ',
      value: seconds ? `10^${formatNumber(logSeconds, { maximumFractionDigits: 2 })}` : 'log₁₀(0) is undefined',
      after: seconds ? ' on a logarithmic scale.' : '.', classification: 'Estimated',
      note: seconds ? 'Expand the full value to follow the same lifetime logarithmically from seconds through decades; each step of 1 means ten times as much.' : 'No finite power of ten equals zero, so zero has no real base-10 logarithm.',
      fullValue: seconds ? logarithmicScaleText : undefined,
      math: detail({
        title: 'Lifetime from seconds to decades on a logarithmic scale', classification: 'Estimated',
        formula: 'logarithmic position in unit U = log₁₀(lifetime expressed in U)',
        substitution: seconds ? logarithmicScaleText : 'log₁₀(0) is undefined', result: seconds ? logarithmicScaleText : 'Undefined',
        variables: [
          { symbol: 'log₁₀', definition: 'the exponent to which 10 must be raised to produce the input' },
          { symbol: 'U', definition: 'seconds, minutes, hours, days, mean Gregorian years, or decades' },
        ],
        conversions: ['60 seconds = 1 minute', '3,600 seconds = 1 hour', '86,400 seconds = 1 day', '365.2425 days = 1 mean Gregorian year', '10 years = 1 decade'],
        assumptions: 'Uses the live Estimated seconds model: actual completed local calendar intervals plus seconds elapsed since local midnight.',
      }),
    },
  ];
}

function renderProbability(roomSize) {
  const n = Math.max(2, Math.min(100, Math.round(Number(roomSize))));
  const pair = birthdayPairProbability(n);
  const specific = specificBirthdayProbability(n);
  dom.roomSize.value = n;
  dom.roomSizeOutput.textContent = String(n);
  dom.probabilityResults.replaceChildren();

  const addResult = (id, value, description) => {
    const wrapper = createElement('div', 'probability-result');
    wrapper.append(
      createElement('span', 'classification', 'Exact'),
      createElement('strong', '', formatPercent(value * 100, 2)),
      createElement('p', '', description),
    );
    const button = createElement('button', 'math-link', 'Show the maths');
    button.type = 'button';
    button.dataset.mathId = id;
    button.setAttribute('aria-label', `Show the maths for ${description}`);
    wrapper.append(button);
    dom.probabilityResults.append(wrapper);
  };
  addResult('probability-pair', pair, 'chance that at least one pair in the room shares a birthday');
  addResult('probability-specific', specific, 'chance that at least one other person shares your birthday');
  dom.probabilityStatus.textContent = `${n} people: ${formatPercent(pair * 100, 2)} chance of any shared pair; ${formatPercent(specific * 100, 2)} chance someone shares your birthday.`;

  mathDetails['probability-pair'] = detail({
    title: 'At least one shared birthday pair', classification: 'Exact',
    formula: 'P(shared pair) = 1 − (365 × 364 × … × (365 − n + 1)) / 365ⁿ',
    substitution: `1 − [(365/365) × (364/365) × … × (${365 - n + 1}/365)]`,
    result: `${formatNumber(pair, { maximumFractionDigits: 6 })} = ${formatPercent(pair * 100, 3)}`,
    variables: { symbol: 'n', definition: 'number of people in the room', value: n },
    assumptions: '365 equally likely, independent birthdays; 29 February and seasonal birth patterns are ignored.',
    uncertainty: 'Exact within the simplified probability model; real birth dates are not perfectly uniform.', source: BIRTHDAY_MODEL_SOURCE,
  });
  mathDetails['probability-specific'] = detail({
    title: 'Someone shares your particular birthday', classification: 'Exact',
    formula: 'P(match with you) = 1 − (364/365)ⁿ⁻¹',
    substitution: `1 − (364/365)^(${n} − 1)`,
    result: `${formatNumber(specific, { maximumFractionDigits: 6 })} = ${formatPercent(specific * 100, 3)}`,
    variables: { symbol: 'n − 1', definition: 'everyone in the room except you', value: n - 1 },
    assumptions: '365 equally likely, independent birthdays; 29 February and seasonal birth patterns are ignored.',
    uncertainty: 'Exact within the simplified probability model; real birth dates are not perfectly uniform.', source: BIRTHDAY_MODEL_SOURCE,
  });
  modal.updateDetail('probability-pair', mathDetails['probability-pair']);
  modal.updateDetail('probability-specific', mathDetails['probability-specific']);
}

function dataMethodNote(point) {
  if (!point) return '';
  if (!point.interpolated && point.periodLabel) {
    return `${point.periodLabel} is a published ${point.observationType || 'period estimate'}, not a measurement for one exact calendar year.`;
  }
  if (!point.interpolated && point.observationType) {
    return `${point.year} is a stored ${point.observationType}; its method is identified in the source notes.`;
  }
  if (!point.interpolated && point.estimateType) {
    return `${point.year} is a published ${point.estimateType}, not a literal count.`;
  }
  if (!point.interpolated) return `${point.year} is a stored published observation.`;
  const [lower, upper] = point.surroundingPoints;
  return `${point.year} was linearly interpolated between ${lower.year} and ${upper.year}; it is not an official measurement.`;
}

function pointYearLabel(point) {
  return point.periodLabel || point.yearLabel || String(point.year);
}

function historicalSeriesFor(series) {
  const historicalKeyById = {
    indiaPopulation: 'indiaPopulationHistorical',
    worldPopulation: 'worldPopulationHistorical',
    atmosphericCo2MaunaLoa: 'atmosphericCo2Historical',
    indiaLifeExpectancy: 'indiaLifeExpectancyHistorical',
  };
  return worldData.series[historicalKeyById[series.id]] || null;
}

function sourceFromPoint(point, fallbackSeries) {
  return {
    title: point.sourceTitle || fallbackSeries.source.title,
    url: point.sourceUrl || fallbackSeries.source.url,
  };
}

function sourcesForWindow(window, primarySeries) {
  const candidates = [
    sourceFromPoint(window.start, window.startSeries || primarySeries),
    sourceFromPoint(window.latest, window.latestSeries || primarySeries),
  ];
  return candidates.filter((source, index) => candidates.findIndex((other) => (
    other.url === source.url && other.title === source.title
  )) === index);
}

function lifetimeDataWindow(series, { exactOnly = false } = {}) {
  const birthYear = state.birth.year;
  const interpolateMissing = !exactOnly && Boolean(series.interpolation?.allowed);
  const historical = historicalSeriesFor(series);
  const primaryFirstYear = Number(series.values[0].year);

  if (historical && birthYear < primaryFirstYear) {
    const periodPoint = historical.values.find((point) => (
      Number(point.periodStart) <= birthYear && Number(point.periodEnd) > birthYear
    ));
    const historicalPoint = periodPoint || valueAtYear(historical, birthYear, {
      interpolateMissing: !exactOnly && Boolean(historical.interpolation?.allowed),
    });
    const firstHistoricalPoint = historicalPoint || historical.values.find((point) => Number(point.year) >= birthYear);

    if (firstHistoricalPoint) {
      const start = historicalPoint || valueAtYear(historical, firstHistoricalPoint.year, { interpolateMissing: false });
      const latest = valueAtYear(series, series.values.at(-1).year, { interpolateMissing: false });
      const usesBirthPeriod = Boolean(periodPoint);
      return {
        available: true,
        start,
        latest,
        birthYear,
        mode: historicalPoint && !usesBirthPeriod && Number(historicalPoint.year) === birthYear
          ? 'birth-year'
          : 'series-start',
        yearsAfterBirth: usesBirthPeriod ? 0 : Math.max(0, Number(start.year) - birthYear),
        startIsInterpolated: Boolean(start.interpolated),
        crossSeries: true,
        startSeries: historical,
        latestSeries: series,
      };
    }
  }

  return {
    ...comparisonWindow(series, birthYear, { interpolateMissing }),
    startSeries: series,
    latestSeries: series,
  };
}

function comparisonWindowNote(window) {
  const rangeNote = Number.isFinite(window.start.lowerBound) && Number.isFinite(window.start.upperBound)
    ? ` Published estimates for ${pointYearLabel(window.start)} span ${formatCompactValue(window.start.lowerBound)} to ${formatCompactValue(window.start.upperBound)}.`
    : '';
  if (window.mode === 'latest-benchmark') {
    return `The latest stored observation is ${window.dataLagYears} ${plural(window.dataLagYears, 'year')} earlier than the visitor’s birth year; no future value is invented.`;
  }
  if (window.mode === 'series-start') {
    if (window.yearsAfterBirth > 0) {
      return `Comparable records begin in ${pointYearLabel(window.start)}, ${window.yearsAfterBirth} ${plural(window.yearsAfterBirth, 'year')} after birth. The change is measured from that first in-lifetime record, not from an invented birth-year value.${rangeNote}`;
    }
    return `The first comparable record in this lifetime is the published ${pointYearLabel(window.start)} benchmark; no earlier value is invented.${rangeNote}`;
  }
  return `${dataMethodNote(window.start)}${rangeNote}`;
}

function comparisonPeriod(window) {
  return window.mode === 'birth-year'
    ? `between ${pointYearLabel(window.start)} and ${pointYearLabel(window.latest)}`
    : `from the first comparable record in ${pointYearLabel(window.start)} to ${pointYearLabel(window.latest)}`;
}

function buildWorldStats() {
  const s = worldData.series;
  const stats = [];

  const addChange = ({
    id,
    series,
    subject,
    valueFormatter,
    unitPhrase,
    resultUnit = series.unit,
    precision = 2,
    differenceLabel = 'change',
    noteExtra = '',
    uncertainty,
    endpointFormatter = valueFormatter,
    endpointUnit = series.unit,
    exactOnly = false,
  }) => {
    const window = lifetimeDataWindow(series, { exactOnly });
    const start = window.start;
    const latest = window.latest;
    const uncertaintyNotes = uncertainty || [
      ...(window.crossSeries ? window.startSeries?.notes || [] : []),
      ...(series.notes || []),
    ];

    if (window.mode === 'latest-benchmark' || Number(start.year) === Number(latest.year)) {
      const lagNote = window.mode === 'latest-benchmark'
        ? comparisonWindowNote(window)
        : `The visitor’s birth year and the latest stored year are both ${latest.year}, so a later endpoint does not yet exist.`;
      stats.push({
        id,
        before: `The latest published ${subject.toLowerCase()} benchmark is `,
        numeric: latest.value,
        formatter: endpointFormatter,
        after: `${endpointUnit ? ` ${endpointUnit}` : ''} in ${pointYearLabel(latest)}.`,
        classification: 'Data-based',
        note: `${lagNote}${noteExtra ? ` ${noteExtra}` : ''}`,
        fullValue: `${pointYearLabel(latest)}: ${formatNumber(latest.value, { maximumFractionDigits: 6 })} ${series.unit}`,
        math: detail({
          title: `${subject} latest published benchmark`, classification: 'Data-based',
          formula: window.mode === 'latest-benchmark'
            ? 'data lag = birth year − latest published year'
            : 'latest benchmark = stored value for the latest published year',
          substitution: window.mode === 'latest-benchmark'
            ? `${state.birth.year} − ${latest.year}`
            : `${series.id}[${latest.year}]`,
          result: window.mode === 'latest-benchmark'
            ? `${window.dataLagYears} ${plural(window.dataLagYears, 'year')} of data lag; latest value ${endpointFormatter(latest.value)} ${endpointUnit}`
            : `${endpointFormatter(latest.value)} ${endpointUnit} in ${latest.year}`,
          variables: { symbol: 'latest value', definition: `latest verified observation stored offline (${latest.year})`, value: latest.value },
          assumptions: [lagNote, `The local dataset was accessed ${CURRENT_DATA_ACCESS_DATE}.`],
          uncertainty: uncertaintyNotes,
          source: sourcesForWindow(window, series),
        }),
      });
      return true;
    }

    const change = latest.value - start.value;
    const direction = change >= 0 ? 'increased by ' : 'decreased by ';
    stats.push({
      id, before: `${subject} ${direction}`, numeric: Math.abs(change), formatter: valueFormatter,
      after: `${unitPhrase} ${comparisonPeriod(window)}.`, classification: 'Data-based',
      note: `From ${endpointFormatter(start.value)} ${endpointUnit} to ${endpointFormatter(latest.value)} ${endpointUnit}. ${comparisonWindowNote(window)}${window.crossSeries ? ' The endpoints use separately identified historical and modern methods.' : ''} Latest stored year: ${latest.year}.${noteExtra ? ` ${noteExtra}` : ''}`,
      fullValue: `${pointYearLabel(start)}: ${formatNumber(start.value, { maximumFractionDigits: 6 })}; ${pointYearLabel(latest)}: ${formatNumber(latest.value, { maximumFractionDigits: 6 })} ${series.unit}`,
      math: detail({
        title: `${subject} ${differenceLabel}`, classification: 'Data-based',
        formula: 'change = latest published value − first comparable lifetime value',
        substitution: `${formatNumber(latest.value, { maximumFractionDigits: precision + 2 })} − ${formatNumber(start.value, { maximumFractionDigits: precision + 2 })}`,
        result: `${change >= 0 ? '+' : '−'}${valueFormatter(Math.abs(change))} ${resultUnit}`,
        variables: [
          { symbol: 'starting value', definition: window.mode === 'birth-year' ? `${start.interpolated ? 'interpolated' : 'published'} birth-year value (${pointYearLabel(start)})` : `first comparable in-lifetime record (${pointYearLabel(start)})`, value: start.value },
          { symbol: 'latest value', definition: `latest observation stored offline (${latest.year})`, value: latest.value },
        ],
        assumptions: [comparisonWindowNote(window), window.crossSeries ? 'The historical and modern endpoints use different documented collection or estimation methods; the subtraction is an approximate long-run comparison.' : '', `The local dataset was accessed ${CURRENT_DATA_ACCESS_DATE}; later source revisions are not fetched while offline.`].filter(Boolean),
        uncertainty: uncertaintyNotes,
        source: sourcesForWindow(window, series),
      }),
    });
    return true;
  };

  addChange({
    id: 'world-india-population', series: s.indiaPopulation, subject: 'India’s population',
    valueFormatter: (value) => formatCompactValue(value), unitPhrase: ' people ', endpointUnit: 'people', precision: 0, differenceLabel: 'population change',
  });
  addChange({
    id: 'world-population', series: s.worldPopulation, subject: 'The world population',
    valueFormatter: (value) => formatCompactValue(value), unitPhrase: ' people ', endpointUnit: 'people', precision: 0, differenceLabel: 'population change',
  });
  addChange({
    id: 'world-internet', series: s.indiaInternetUse, subject: 'Internet use in India',
    valueFormatter: (value) => formatNumber(value, { maximumFractionDigits: 1 }), unitPhrase: ' percentage points ', resultUnit: 'percentage points', endpointFormatter: (value) => formatPercent(value, 1), endpointUnit: '', precision: 2,
  });
  addChange({
    id: 'world-electricity', series: s.indiaElectricityAccess, subject: 'Access to electricity in India',
    valueFormatter: (value) => formatNumber(value, { maximumFractionDigits: 1 }), unitPhrase: ' percentage points ', resultUnit: 'percentage points', endpointFormatter: (value) => formatPercent(value, 1), endpointUnit: '', precision: 2,
  });
  addChange({
    id: 'world-co2', series: s.atmosphericCo2MaunaLoa, subject: 'Atmospheric CO₂ concentration',
    valueFormatter: (value) => formatNumber(value, { maximumFractionDigits: 2 }), unitPhrase: ' parts per million ', endpointUnit: 'ppm', precision: 2,
    noteExtra: `The latest direct annual mean reports ±${s.atmosphericCo2MaunaLoa.values.at(-1).uncertainty} ppm; the separate 1900 Law Dome proxy reports ±${s.atmosphericCo2Historical.values[0].uncertainty} ppm.`,
    uncertainty: [
      `Modern direct annual means report ±${s.atmosphericCo2MaunaLoa.values.at(-1).uncertainty} ppm; the 1900 ice-core proxy reports ±${s.atmosphericCo2Historical.values[0].uncertainty} ppm.`,
      'When a comparison crosses from the ice-core proxy to Mauna Loa monitoring, site and measurement-method differences matter in addition to the stated endpoint uncertainty.',
      ...s.atmosphericCo2Historical.notes,
      ...s.atmosphericCo2MaunaLoa.notes,
    ],
  });

  addChange({
    id: 'world-inflation', series: s.indiaConsumerPriceInflation, subject: 'India’s annual consumer-price inflation rate',
    valueFormatter: (value) => formatNumber(value, { maximumFractionDigits: 2 }),
    endpointFormatter: (value) => formatPercent(value, 2), endpointUnit: '',
    unitPhrase: ' percentage points ', resultUnit: 'percentage points', precision: 4,
    differenceLabel: 'rate change',
    noteExtra: 'Annual inflation is a rate for one year; this compares endpoint rates and is not cumulative inflation.',
  });

  const cpiWindow = lifetimeDataWindow(s.indiaConsumerPriceIndex);
  const cpiStart = cpiWindow.start;
  const cpiLatest = cpiWindow.latest;
  if (cpiWindow.mode === 'latest-benchmark') {
    stats.push({
      id: 'world-purchasing-power', before: 'The latest broad Indian CPI benchmark is ',
      numeric: cpiLatest.value, formatter: (value) => formatNumber(value, { maximumFractionDigits: 2 }),
      after: ` in ${cpiLatest.year}.`, classification: 'Data-based',
      note: `${comparisonWindowNote(cpiWindow)} A ₹100 birth-year equivalence will become possible when that year’s CPI is published.`,
      math: detail({
        title: 'CPI data-lag calculation', classification: 'Data-based',
        formula: 'data lag = birth year − latest CPI year',
        substitution: `${state.birth.year} − ${cpiLatest.year}`,
        result: `${cpiWindow.dataLagYears} ${plural(cpiWindow.dataLagYears, 'year')} of data lag`,
        variables: { symbol: 'CPI', definition: 'broad consumer price index', value: `${cpiLatest.value} in ${cpiLatest.year}` },
        assumptions: 'No future CPI and no backward extrapolation are invented.',
        uncertainty: s.indiaConsumerPriceIndex.notes,
        source: sourceFromSeries(s.indiaConsumerPriceIndex),
      }),
    });
  } else {
    const equivalent = purchasingPowerEquivalent(100, cpiStart.value, cpiLatest.value);
    stats.push({
      id: 'world-purchasing-power', before: `₹100 in ${pointYearLabel(cpiStart)} is roughly equivalent to `,
      numeric: equivalent, formatter: (value) => `₹${formatNumber(value, { maximumFractionDigits: 0 })}`,
      after: ` in ${cpiLatest.year} by the broad CPI ratio.`, classification: 'Data-based',
      note: `${comparisonWindowNote(cpiWindow)} This is an inflation adjustment for a national basket, not the price of a particular product.`,
      fullValue: `₹${formatNumber(equivalent, { maximumFractionDigits: 2 })}`,
      math: detail({
        title: 'Purchasing-power comparison for ₹100', classification: 'Data-based',
        formula: 'latest-year equivalent = ₹100 × (latest CPI ÷ first comparable CPI)',
        substitution: `₹100 × (${formatNumber(cpiLatest.value, { maximumFractionDigits: 6 })} ÷ ${formatNumber(cpiStart.value, { maximumFractionDigits: 6 })})`,
        result: `₹${formatNumber(equivalent, { maximumFractionDigits: 2 })} in ${cpiLatest.year}`,
        variables: { symbol: 'CPI', definition: 'consumer price index; only the ratio matters', value: `${pointYearLabel(cpiStart)}: ${cpiStart.value}, ${cpiLatest.year}: ${cpiLatest.value}` },
        assumptions: ['A broad national CPI basket is used; individual spending differs.', comparisonWindowNote(cpiWindow)],
        uncertainty: s.indiaConsumerPriceIndex.notes,
        source: sourceFromSeries(s.indiaConsumerPriceIndex),
      }),
    });
  }

  addChange({
    id: 'world-life-expectancy', series: s.indiaLifeExpectancy, subject: 'Life expectancy at birth in India',
    valueFormatter: (value) => formatNumber(value, { maximumFractionDigits: 2 }), unitPhrase: ' years ', endpointUnit: 'years', precision: 3,
  });

  addChange({
    id: 'world-literacy', series: s.indiaAdultLiteracy, subject: 'India’s measured adult literacy rate',
    valueFormatter: (value) => formatNumber(value, { maximumFractionDigits: 1 }),
    endpointFormatter: (value) => formatPercent(value, 1), endpointUnit: '',
    unitPhrase: ' percentage points ', resultUnit: 'percentage points', precision: 4,
    differenceLabel: 'measured change', exactOnly: true,
    noteExtra: 'The age-15+ series is sparse and never interpolated; the calculation begins at the first actual observation on or after birth.',
  });

  const niftyWindow = lifetimeDataWindow(s.nifty50YearEnd, { exactOnly: true });
  const niftyStart = niftyWindow.start;
  const niftyLatest = niftyWindow.latest;
  if (niftyWindow.mode === 'latest-benchmark' || Number(niftyStart.year) === Number(niftyLatest.year)) {
    stats.push({
      id: 'world-nifty', before: 'The latest stored NIFTY 50 year-end price-index close is ',
      numeric: niftyLatest.value, formatter: (value) => formatNumber(value, { maximumFractionDigits: 2 }),
      after: ` in ${niftyLatest.year}.`, classification: 'Data-based',
      note: `${niftyWindow.mode === 'latest-benchmark' ? comparisonWindowNote(niftyWindow) : 'No later year-end endpoint exists yet.'} No pre-series or future index value is invented; this is a dated market benchmark, not a personalised investment return.`,
      math: detail({
        title: 'Latest NIFTY 50 endpoint', classification: 'Data-based',
        formula: niftyWindow.mode === 'latest-benchmark' ? 'data lag = birth year − latest index year' : 'latest endpoint = stored year-end close',
        substitution: niftyWindow.mode === 'latest-benchmark' ? `${state.birth.year} − ${niftyLatest.year}` : `NIFTY[${niftyLatest.year}]`,
        result: `${formatNumber(niftyLatest.value, { maximumFractionDigits: 2 })} in ${niftyLatest.year}`,
        variables: 'This is a price index, not a total-return index.',
        assumptions: 'No pre-inception value, future value or investment return is invented.',
        uncertainty: s.nifty50YearEnd.notes,
        source: { title: `NSE source for the ${niftyLatest.year} endpoint`, url: niftyLatest.sourceUrl || s.nifty50YearEnd.source.url },
      }),
    });
  } else {
    const growth = (niftyLatest.value / niftyStart.value - 1) * 100;
    const direction = growth > 0 ? 'rose by ' : 'fell by ';
    stats.push({
      id: 'world-nifty',
      before: growth === 0 ? 'The NIFTY 50 year-end price index was ' : `The NIFTY 50 year-end price index ${direction}`,
      ...(growth === 0 ? { value: 'unchanged' } : { numeric: Math.abs(growth), formatter: (value) => formatPercent(value, 1) }),
      after: ` ${comparisonPeriod(niftyWindow)}.`, classification: 'Data-based',
      note: `From ${formatNumber(niftyStart.value, { maximumFractionDigits: 2 })} on ${niftyStart.date || 'the first stored endpoint'} to ${formatNumber(niftyLatest.value, { maximumFractionDigits: 2 })} on ${niftyLatest.date || 'the latest stored endpoint'}. ${comparisonWindowNote(niftyWindow)} No pre-series index value is invented; this is not a personalised investment return and excludes dividends.`,
      fullValue: `${formatNumber(growth, { maximumFractionDigits: 4 })}% price-index change`,
      math: detail({
        title: 'NIFTY 50 year-end price-index growth', classification: 'Data-based',
        formula: 'growth = (latest year-end close ÷ first comparable stored close − 1) × 100',
        substitution: `(${formatNumber(niftyLatest.value, { maximumFractionDigits: 2 })} ÷ ${formatNumber(niftyStart.value, { maximumFractionDigits: 2 })} − 1) × 100`,
        result: formatPercent(growth, 3),
        variables: ['The starting and latest values are official dated index observations stored offline.', 'The 2011 value is the 30 December final-trading-day close.', 'This is a price index, not a total-return index.'],
        assumptions: [comparisonWindowNote(niftyWindow), 'Endpoint comparison only; dividends, fees, taxes and intra-year changes are excluded.'],
        uncertainty: s.nifty50YearEnd.notes,
        source: [
          { title: `NSE source for the ${niftyStart.year} endpoint`, url: niftyStart.sourceUrl || s.nifty50YearEnd.source.url },
          { title: `NSE source for the ${niftyLatest.year} endpoint`, url: niftyLatest.sourceUrl || s.nifty50YearEnd.source.url },
        ],
      }),
    });
  }

  return stats;
}

function renderWorldChart() {
  const series = worldData.series.indiaPopulation;
  const historical = worldData.series.indiaPopulationHistorical;
  const primaryFirstYear = Number(series.values[0].year);
  const historicalPoints = historical
    ? historical.values.filter((point) => Number(point.year) >= state.birth.year && Number(point.year) < primaryFirstYear)
    : [];
  const primaryPoints = series.values.filter((point) => Number(point.year) >= Math.max(state.birth.year, primaryFirstYear));
  const points = [...historicalPoints, ...primaryPoints];
  const chartUsesHistorical = historicalPoints.length > 0;
  const width = 760;
  const height = 280;
  const padding = 42;
  dom.worldChart.replaceChildren();
  if (points.length < 2) {
    const firstYear = historical?.values[0].year || series.values[0].year;
    const latestYear = series.values.at(-1).year;
    const header = createElement('div', 'world-chart__header');
    header.append(
      createElement('h3', '', 'A lifetime population line needs at least two points'),
      createElement('p', '', `${firstYear}–${latestYear} stored coverage`),
    );
    const message = createElement('p', 'explain-note', points.length === 1
      ? `Only the ${points[0].year} observation lies on or after this birth year, so drawing a line would imply a trend the data cannot yet show.`
      : `The birth year ${state.birth.year} is later than the latest stored observation, so no pre-birth values are drawn.`);
    const button = createElement('button', 'math-link', 'Show the maths');
    button.type = 'button'; button.dataset.mathId = 'world-chart-method';
    dom.worldChart.append(header, message, button);
    mathDetails['world-chart-method'] = detail({
      title: 'Population chart availability', classification: 'Data-based',
      formula: 'draw a lifetime line only when number of on-or-after-birth observations ≥ 2',
      substitution: `${points.length} eligible observation(s) for birth year ${state.birth.year}`,
      result: 'No lifetime line drawn', variables: 'Pre-birth observations are excluded.',
      assumptions: 'The chart never extrapolates or presents pre-birth history as lifetime change.',
      uncertainty: [...(historical?.notes || []), ...series.notes],
      source: chartUsesHistorical ? [sourceFromSeries(historical), sourceFromSeries(series)] : sourceFromSeries(series),
    });
    return;
  }
  const values = points.map(({ value }) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yearMin = points[0].year;
  const yearMax = points.at(-1).year;
  const coords = points.map((point) => ({
    ...point,
    x: padding + (point.year - yearMin) / Math.max(1, yearMax - yearMin) * (width - padding * 2),
    y: height - padding - (point.value - min) / Math.max(1, max - min) * (height - padding * 2),
  }));

  const header = createElement('div', 'world-chart__header');
  const heading = createElement('h3', '', 'India’s population in the stored data');
  const meta = createElement('p', '', `${yearMin}–${yearMax} · ${chartUsesHistorical ? 'census anchors followed by annual estimates' : 'latest published year shown'}`);
  header.append(heading, createElement('span', 'classification', 'Data-based'), meta);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Line chart of India's population from ${yearMin} to ${yearMax}`);
  for (let index = 0; index < 4; index += 1) {
    const y = padding + index * (height - padding * 2) / 3;
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', String(padding)); line.setAttribute('x2', String(width - padding));
    line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
    svg.append(line);
  }
  const pathData = coords.map(({ x, y }, index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const area = document.createElementNS(svg.namespaceURI, 'path');
  area.setAttribute('class', 'chart-area');
  area.setAttribute('d', `${pathData} L${coords.at(-1).x} ${height - padding} L${coords[0].x} ${height - padding} Z`);
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', pathData);
  svg.append(area, path);
  [coords[0], coords.at(-1)].forEach((point) => {
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    circle.setAttribute('cx', String(point.x)); circle.setAttribute('cy', String(point.y)); circle.setAttribute('r', '5');
    const label = document.createElementNS(svg.namespaceURI, 'text');
    label.setAttribute('x', String(point.x)); label.setAttribute('y', String(point.y - 14));
    label.setAttribute('text-anchor', point === coords[0] ? 'start' : 'end');
    label.textContent = `${point.year}: ${formatCompactValue(point.value)}`;
    svg.append(circle, label);
  });
  const button = createElement('button', 'math-link', 'Show the maths');
  button.type = 'button'; button.dataset.mathId = 'world-chart-method';
  button.setAttribute('aria-label', 'Show the maths for the India population line chart');
  dom.worldChart.append(header, svg, button);

  mathDetails['world-chart-method'] = detail({
    title: 'Population line-chart scaling', classification: 'Data-based',
    formula: 'x = left + (year − first year)/(last year − first year) × plot width\ny = bottom − (value − minimum)/(maximum − minimum) × plot height',
    substitution: `${points.length} stored observations from ${yearMin} through ${yearMax}`, result: 'Each observation is mapped linearly to one SVG point',
    variables: ['x and y are SVG coordinates.', 'The vertical axis is scaled to the displayed data range and does not begin at zero.'],
    assumptions: chartUsesHistorical
      ? 'The early points are official decennial census anchors; the annual World Bank estimate series begins in 1960. A connecting line makes direction legible but does not erase that method change or create new observations.'
      : 'Lines connect annual observations to make the direction legible; they do not create new official measurements between years.',
    uncertainty: [...(chartUsesHistorical ? historical.notes : []), ...series.notes],
    source: chartUsesHistorical ? [sourceFromSeries(historical), sourceFromSeries(series)] : sourceFromSeries(series),
  });
}

function buildSpaceStats(space) {
  const c = space.constants;
  const earthSource = [
    SPACE_SOURCES.earthAndMoon,
    { title: 'NASA/JPL Planetary Physical Parameters', url: 'https://ssd.jpl.nasa.gov/planets/phys_par.html' },
  ];
  const galaxySource = {
    title: 'NASA Solar System Facts — galactic motion context',
    url: 'https://science.nasa.gov/solar-system/solar-system-facts/',
  };
  return [
    {
      id: 'space-sun-distance', before: 'Earth has carried you roughly ', numeric: space.distanceAroundSunKilometres,
      formatter: (value) => formatDistanceKilometres(value), after: ' around the Sun.', classification: 'Estimated',
      note: `Distance = speed × time, using Earth’s rounded mean orbital speed of ${formatExact(c.earthOrbitalSpeedKilometresPerHour)} km/h.`,
      fullValue: `${formatExact(Math.round(space.distanceAroundSunKilometres))} kilometres`,
      math: detail({
        title: 'Distance travelled around the Sun', classification: 'Estimated',
        formula: 'orbital distance = mean orbital speed × elapsed completed-day hours',
        substitution: `${formatExact(c.earthOrbitalSpeedKilometresPerHour)} km/h × (${formatExact(state.ageDays)} × 24 h)`,
        result: `${formatExact(Math.round(space.distanceAroundSunKilometres))} km`,
        variables: [
          { symbol: 'v', definition: 'rounded mean Earth orbital speed', value: `${formatExact(c.earthOrbitalSpeedKilometresPerHour)} km/h` },
          { symbol: 't', definition: 'completed lifetime hours', value: formatExact(state.ageDays * 24) },
        ],
        conversions: '24 hours/day', assumptions: 'Earth’s varying speed along its elliptical orbit is replaced by a mean speed.',
        uncertainty: 'Small model error from the rounded mean speed plus up to one incomplete current day.', source: earthSource,
      }),
    },
    {
      id: 'space-earth-orbits', before: 'That journey contains about ', numeric: space.earthOrbits,
      formatter: (value) => formatNumber(value, { maximumFractionDigits: 3 }), after: ` solar orbits—${formatExact(space.completeEarthOrbits)} complete.`, classification: 'Estimated',
      note: `The physical-orbit model divides by a mean sidereal period of ${c.earthOrbitalPeriodDays} days.`,
      fullValue: `${formatNumber(space.earthOrbits, { maximumFractionDigits: 8 })} estimated orbits`,
      math: detail({
        title: 'Earth orbits during your lifetime', classification: 'Estimated',
        formula: 'number of orbits = completed age in days ÷ mean sidereal orbital period',
        substitution: `${formatExact(state.ageDays)} ÷ ${c.earthOrbitalPeriodDays}`,
        result: `${formatNumber(space.earthOrbits, { maximumFractionDigits: 6 })} orbits; floor = ${space.completeEarthOrbits} complete`,
        variables: { symbol: 'orbital period', definition: 'mean time for Earth to return relative to the stars', value: `${c.earthOrbitalPeriodDays} days` },
        assumptions: 'A constant mean period is used; this physical ratio is separate from calendar birthday counting.',
        uncertainty: 'Small model error from the mean period and omitted partial current day.', source: earthSource,
      }),
    },
    {
      id: 'space-galaxy', before: 'With the Solar System, you may have moved ', numeric: space.galacticDistanceKilometres,
      formatter: (value) => formatDistanceKilometres(value), after: ' around the Milky Way.', classification: 'Estimated',
      note: `This large-scale model uses an approximate galactic speed of ${c.solarSystemGalacticSpeedKilometresPerSecond} km/s.`,
      fullValue: `${formatExact(Math.round(space.galacticDistanceKilometres))} kilometres`,
      math: detail({
        title: 'Distance travelled with the Solar System', classification: 'Estimated',
        formula: 'galactic distance = approximate galactic speed × lifetime seconds',
        substitution: `${c.solarSystemGalacticSpeedKilometresPerSecond} km/s × (${formatExact(state.ageDays)} × 86,400 s)`,
        result: `${formatExact(Math.round(space.galacticDistanceKilometres))} km`,
        variables: { symbol: 'galactic speed', definition: 'rounded estimate of the Sun’s orbital speed around the Milky Way', value: `${c.solarSystemGalacticSpeedKilometresPerSecond} km/s` },
        conversions: '1 completed day = 86,400 seconds',
        assumptions: 'The Solar System’s curved galactic path is treated as speed × time, and the speed is approximate.',
        uncertainty: 'The adopted 220 km/s is deliberately rounded. NASA’s current public overview gives about 829,000 km/h (roughly 230 km/s), so this teaching model is about 4.5% lower; reference frames and models also differ.', source: galaxySource,
      }),
    },
    {
      id: 'space-moon-orbits', before: 'The Moon has completed about ', numeric: space.moonSiderealOrbits,
      formatter: (value) => formatNumber(value, { maximumFractionDigits: 1 }), after: ' sidereal orbits during your life.', classification: 'Estimated',
      note: `One mean sidereal orbit is ${c.moonSiderealOrbitDays} days, measured relative to the stars.`,
      fullValue: `${formatNumber(space.moonSiderealOrbits, { maximumFractionDigits: 7 })} sidereal orbits`,
      math: detail({
        title: 'Moon sidereal orbits', classification: 'Estimated',
        formula: 'sidereal orbits = completed age in days ÷ Moon sidereal period',
        substitution: `${formatExact(state.ageDays)} ÷ ${c.moonSiderealOrbitDays}`,
        result: `${formatNumber(space.moonSiderealOrbits, { maximumFractionDigits: 5 })} orbits`,
        variables: { symbol: 'sidereal period', definition: 'time for the Moon to orbit Earth relative to distant stars', value: `${c.moonSiderealOrbitDays} days` },
        assumptions: 'A constant mean period is used.', uncertainty: 'Small rounding and orbital-variation error.', source: SPACE_SOURCES.moonFacts,
      }),
    },
    {
      id: 'space-lunar-cycles', before: 'You have also lived through roughly ', numeric: space.lunarPhaseCycles,
      formatter: (value) => formatNumber(value, { maximumFractionDigits: 1 }), after: ' lunar phase cycles.', classification: 'Estimated',
      note: `A phase cycle is longer than a sidereal orbit: ${c.moonSynodicCycleDays} mean days from new Moon to new Moon.`,
      fullValue: `${formatNumber(space.lunarPhaseCycles, { maximumFractionDigits: 7 })} synodic cycles`,
      math: detail({
        title: 'Lunar phase cycles', classification: 'Estimated',
        formula: 'phase cycles = completed age in days ÷ mean synodic month',
        substitution: `${formatExact(state.ageDays)} ÷ ${c.moonSynodicCycleDays}`,
        result: `${formatNumber(space.lunarPhaseCycles, { maximumFractionDigits: 5 })} cycles`,
        variables: { symbol: 'synodic month', definition: 'mean interval between matching lunar phases', value: `${c.moonSynodicCycleDays} days` },
        assumptions: 'A constant mean cycle is used.', uncertainty: 'Actual lunations vary around the mean.', source: SPACE_SOURCES.moonFacts,
      }),
    },
    {
      id: 'space-moon-recession', before: 'In that time, the Moon has receded by approximately ', numeric: space.moonRecessionCentimetres,
      formatter: (value) => `${formatNumber(value, { maximumFractionDigits: 1 })} cm`, after: '.', classification: 'Estimated',
      note: `Lunar laser ranging gives a present-day average near ${c.moonRecessionCentimetresPerYear} cm/year.`,
      fullValue: `${formatNumber(space.moonRecessionCentimetres, { maximumFractionDigits: 5 })} centimetres`,
      math: detail({
        title: 'Moon recession during your lifetime', classification: 'Estimated',
        formula: 'recession = mean calendar age in years × recession rate',
        substitution: `(${formatExact(state.ageDays)} ÷ ${c.meanCalendarYearDays}) × ${c.moonRecessionCentimetresPerYear} cm/year`,
        result: `${formatNumber(space.moonRecessionCentimetres, { maximumFractionDigits: 3 })} cm`,
        variables: { symbol: 'recession rate', definition: 'rounded present-day average from lunar laser ranging', value: `${c.moonRecessionCentimetresPerYear} cm/year` },
        conversions: '100 cm = 1 metre',
        assumptions: 'The current average recession rate is projected backward as constant across the visitor’s lifetime.',
        uncertainty: 'Earth–Moon recession varies over geological time; 3.8 cm/year is a rounded contemporary rate.', source: SPACE_SOURCES.lunarRanging,
      }),
    },
    {
      id: 'space-rotation', before: 'At the equator, Earth’s rotation would carry a point about ', numeric: space.equatorialRotationDistanceKilometres,
      formatter: (value) => formatDistanceKilometres(value), after: ' in the same number of days.', classification: 'Estimated',
      note: 'This is an equatorial comparison, not your personal distance: latitude changes the circle travelled each rotation.',
      fullValue: `${formatExact(Math.round(space.equatorialRotationDistanceKilometres))} kilometres`,
      math: detail({
        title: 'Equatorial rotation comparison', classification: 'Estimated',
        formula: 'equatorial comparison distance = equatorial circumference × completed solar days',
        substitution: `${formatExact(c.earthEquatorialCircumferenceKilometres)} km × ${formatExact(state.ageDays)}`,
        result: `${formatExact(Math.round(space.equatorialRotationDistanceKilometres))} km`,
        variables: { symbol: 'equatorial circumference', definition: 'rounded distance around Earth at the equator', value: `${formatExact(c.earthEquatorialCircumferenceKilometres)} km` },
        assumptions: 'One equatorial circumference per solar calendar day; latitude, sidereal-day difference and Earth’s exact shape are ignored.',
        uncertainty: 'This simplified solar-day model is about 0.27% below a sidereal-rotation model and is not a visitor-specific path.', source: earthSource,
      }),
    },
  ];
}

function bodyOverridesFromLab(values, sleepUserAdjusted) {
  if (!values) return {};
  const overrides = {
    heartRateBpm: values.heartRate,
    breathsPerMinute: values.breathRate,
    blinksPerAwakeMinute: values.blinkRate,
    stepsPerDay: values.stepsPerDay,
    stepLengthMetres: values.stepLength,
    waterLitresPerDay: values.waterLitres,
  };
  if (sleepUserAdjusted) overrides.sleepHoursPerDay = values.sleepHours;
  return overrides;
}

function setupEstimateLab(preservedModel = null) {
  estimateLab?.destroy();
  const defaultBody = estimateBody(state.ageDays);
  const averageSleep = state.ageDays > 0 ? defaultBody.sleepHours / state.ageDays : estimateBody(1).sleepHours;
  const defaults = {
    heartRate: DEFAULT_BODY_ASSUMPTIONS.heartRateBpm,
    breathRate: DEFAULT_BODY_ASSUMPTIONS.breathsPerMinute,
    sleepHours: Number(averageSleep.toFixed(1)),
    blinkRate: DEFAULT_BODY_ASSUMPTIONS.blinksPerAwakeMinute,
    stepsPerDay: DEFAULT_BODY_ASSUMPTIONS.stepsPerDay,
    stepLength: DEFAULT_BODY_ASSUMPTIONS.stepLengthMetres,
    waterLitres: DEFAULT_BODY_ASSUMPTIONS.waterLitresPerDay,
    roomSize: Number(dom.roomSize.value),
    expectedLifespan: 80,
  };
  state.sleepUserAdjusted = Boolean(preservedModel?.sleepUserAdjusted);
  const modelDays = state.ageDays + state.elapsed.currentDayProgress;

  estimateLab = new EstimateLab({
    controlsRoot: document.querySelector('#estimate-controls'),
    outputRoot: document.querySelector('#estimate-output'),
    resetButton: document.querySelector('#reset-estimates'),
    defaults,
    ageDays: state.ageDays,
    ageMinutes: state.elapsed.minutes,
    modelDays,
    onModel({ key, model, definition, inputValue, defaultValue, values }) {
      dom.estimateStatus.textContent = `${model.title}: ${model.unit === 'percent' ? formatPercent(model.value, 2) : `${formatNumber(model.value, { maximumFractionDigits: 2 })} ${model.unit}`}.`;
      const classification = key === 'expectedLifespan' ? 'Projected' : key === 'roomSize' ? 'Exact' : 'Estimated';
      const substitutions = {
        heartRate: `${formatNumber(state.elapsed.minutes, { maximumFractionDigits: 4 })} lifetime minutes × ${inputValue} beats/minute`,
        breathRate: `${formatNumber(state.elapsed.minutes, { maximumFractionDigits: 4 })} lifetime minutes × ${inputValue} breaths/minute`,
        sleepHours: `${formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 })} modelled days × ${inputValue} hours/day`,
        blinkRate: `${formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 })} modelled days × (24 − ${values.sleepHours}) awake hours/day × 60 × ${inputValue} blinks/minute`,
        stepsPerDay: `${formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 })} modelled days × ${formatExact(inputValue)} steps/day`,
        stepLength: `${formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 })} modelled days × ${formatExact(values.stepsPerDay)} steps/day × ${inputValue} metres/step ÷ 1,000`,
        waterLitres: `${formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 })} modelled days × ${inputValue} litres/day`,
        roomSize: `1 − (364/365)^(${inputValue} − 1)`,
        expectedLifespan: `(${formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 })} ÷ 365.2425) ÷ ${inputValue} × 100`,
      };
      const modelVariables = {
        heartRate: [{ symbol: 'M', definition: 'live date-based elapsed minutes', value: formatNumber(state.elapsed.minutes, { maximumFractionDigits: 4 }) }],
        breathRate: [{ symbol: 'M', definition: 'live date-based elapsed minutes', value: formatNumber(state.elapsed.minutes, { maximumFractionDigits: 4 }) }],
        sleepHours: [{ symbol: 'd', definition: 'completed days plus today’s elapsed fraction', value: formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 }) }],
        blinkRate: [
          { symbol: 'd', definition: 'completed days plus today’s elapsed fraction', value: formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 }) },
          { symbol: 'h', definition: 'selected average sleep', value: `${values.sleepHours} hours/day` },
        ],
        stepsPerDay: [{ symbol: 'd', definition: 'completed days plus today’s elapsed fraction', value: formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 }) }],
        stepLength: [
          { symbol: 'd', definition: 'completed days plus today’s elapsed fraction', value: formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 }) },
          { symbol: 's', definition: 'current Estimate Lab step-count assumption', value: `${formatExact(values.stepsPerDay)} steps/day` },
        ],
        waterLitres: [{ symbol: 'd', definition: 'completed days plus today’s elapsed fraction', value: formatNumber(state.ageDays + state.elapsed.currentDayProgress, { maximumFractionDigits: 6 }) }],
        roomSize: [{ symbol: 'n', definition: 'number of people in the room including the visitor', value: inputValue }],
        expectedLifespan: [{ symbol: 'y', definition: 'date-based age in mean years', value: formatNumber((state.ageDays + state.elapsed.currentDayProgress) / 365.2425, { maximumFractionDigits: 6 }) }],
      };
      const modelDetail = detail({
        title: model.title,
        classification,
        formula: model.formula,
        substitution: substitutions[key],
        result: model.unit === 'percent' ? formatPercent(model.value, 3) : `${formatNumber(model.value, { maximumFractionDigits: 2 })} ${model.unit}`,
        variables: [
          ...(modelVariables[key] || []),
          { symbol: definition.key, definition: definition.label, value: `${inputValue} ${definition.unit}` },
          { symbol: 'default', definition: 'original model input', value: `${defaultValue} ${definition.unit}` },
        ],
        conversions: model.unit === 'kilometres' ? '1,000 metres = 1 kilometre' : undefined,
        assumptions: key === 'expectedLifespan'
          ? 'The selected lifespan is a hypothetical scenario, not a prediction about any person.'
          : key === 'roomSize'
            ? '365 equally likely, independent birthdays; 29 February is ignored.'
            : 'The selected rate is treated as a constant lifetime average.',
        uncertainty: key === 'roomSize'
          ? 'Exact inside the simplified birthday model; real birthdays are not perfectly uniform.'
          : 'The output changes directly with the selected assumption; it is not a personal measurement.',
        source: key === 'roomSize' ? BIRTHDAY_MODEL_SOURCE : BIOLOGY_MODEL_SOURCE,
      });
      mathDetails['estimate-lab-model'] = modelDetail;
      modal.updateDetail('estimate-lab-model', modelDetail);
    },
    onChange(key, _value, values) {
      if (key === 'roomSize') {
        renderProbability(values.roomSize);
        return;
      }
      if (key === 'expectedLifespan') {
        state.expectedLifespan = values.expectedLifespan;
        renderReport();
        return;
      }
      if (key === 'sleepHours') state.sleepUserAdjusted = true;
      if (key === 'reset') {
        state.sleepUserAdjusted = false;
        state.expectedLifespan = defaults.expectedLifespan;
        renderProbability(values.roomSize);
      }

      const overrides = bodyOverridesFromLab(values, state.sleepUserAdjusted);
      state.body = estimateBody(state.ageDays, overrides);
      const freshStats = buildBodyStats(state.body);
      const affected = {
        heartRate: ['body-heartbeats'],
        breathRate: ['body-breaths'],
        sleepHours: ['body-sleep', 'body-blinks'],
        blinkRate: ['body-blinks'],
        stepsPerDay: ['body-steps', 'body-distance'],
        stepLength: ['body-distance'],
        waterLitres: ['body-water'],
        reset: freshStats.map(({ id }) => id),
      }[key] || [];
      for (const id of affected) {
        const stat = freshStats.find((item) => item.id === id);
        if (stat) updateRenderedStat(stat);
      }
      renderReport();
    },
  });

  if (preservedModel?.values) {
    for (const [key, value] of Object.entries(preservedModel.values)) {
      estimateLab.setValue(key, value);
    }
    estimateLab.renderOutput();
  }
}

function addReportItem(container, classification, title, value, formula, icon = 'report', statId = '') {
  const item = createElement('div', 'report-item');
  if (statId) item.dataset.reportStatId = statId;
  const iconWrap = createElement('span', 'report-item__icon');
  iconWrap.append(createSvgIcon(icon));
  const content = createElement('div', 'report-item__content');
  content.append(
    createElement('span', 'report-item__type', classification),
    createElement('strong', '', `${title}: ${value}`),
    createElement('code', '', formula),
  );
  item.append(iconWrap, content);
  container.append(item);
}

function renderReport() {
  const { body, numberProperties: p, space } = state;
  const liveBody = calculateLiveBodyCounters(body, state.elapsed);
  dom.reportSheet.replaceChildren();
  const header = createElement('header', 'report-sheet__header');
  const mark = createElement('span', 'report-sheet__mark');
  mark.append(createSvgIcon('report'));
  const identity = createElement('div', 'report-sheet__identity');
  identity.append(
    createElement('p', 'report-sheet__kicker', 'The Mathematics of You · Personal report'),
    createElement('h3', '', displayDate(state.birth)),
    createElement('p', 'report-sheet__summary', `${formatExact(state.ageDays)} completed days · calculated ${displayDate(state.today)} · date-based model`),
  );
  header.append(
    createElement('h1', 'print-only print-title', 'The Mathematics of You'),
    createElement('h2', 'print-only print-subtitle', 'Your Mathematical Report'),
    mark,
    identity,
  );
  const grid = createElement('div', 'report-grid');
  addReportItem(grid, 'Exact', 'Calendar age', `${state.timeSummary.years}y ${state.timeSummary.months}m ${state.timeSummary.days}d`, 'calendar years + months + remaining days', 'calendar');
  addReportItem(grid, 'Exact', 'Completed days', formatExact(state.ageDays), 'UTC-day(today) − UTC-day(birth)', 'clock');
  addReportItem(grid, 'Exact', 'Mondays experienced', formatExact(state.timeSummary.Mondays), 'complete weeks + Monday in remainder', 'timeline');
  addReportItem(grid, 'Estimated', 'Heartbeats', formatCompactValue(liveBody.heartbeats), `${formatNumber(state.elapsed.minutes, { maximumFractionDigits: 4 })} live minutes × ${body.assumptions.heartRateBpm} bpm`, 'heart', 'heartbeats');
  addReportItem(grid, 'Estimated', 'Time asleep', `${formatCompactValue(body.sleepHours)} hours`, body.sleepModel.model === 'piecewise-age-bands' ? 'Σ(days in age band × midpoint sleep hours)' : `days × ${body.assumptions.sleepHoursPerDay} hours`, 'clock');
  addReportItem(grid, 'Estimated', 'Walking distance', formatDistanceKilometres(body.distanceWalkedKilometres), `days × ${formatExact(body.assumptions.stepsPerDay)} steps × ${body.assumptions.stepLengthMetres} m ÷ 1,000`, 'walk');
  addReportItem(grid, 'Exact', 'Number fingerprint', p.prime ? 'prime' : p.factorizationText, `N = ${formatExact(state.ageDays)}; test divisors through √N`, 'fingerprint');

  const population = worldData.series.indiaPopulation;
  const populationWindow = lifetimeDataWindow(population);
  const populationStart = populationWindow.start;
  const populationLatest = populationWindow.latest;
  if (populationWindow.mode !== 'latest-benchmark' && Number(populationStart.year) !== Number(populationLatest.year)) {
    addReportItem(
      grid,
      'Data-based',
      `India population change, ${pointYearLabel(populationStart)}–${populationLatest.year}`,
      formatCompactValue(populationLatest.value - populationStart.value),
      'latest published population − first comparable lifetime population',
      'globe',
    );
  } else {
    addReportItem(grid, 'Data-based', `Latest India population benchmark, ${populationLatest.year}`, formatCompactValue(populationLatest.value), 'latest stored value; no future value invented', 'globe');
  }
  addReportItem(grid, 'Estimated', 'Distance around the Sun', formatDistanceKilometres(space.distanceAroundSunKilometres), `${formatExact(space.constants.earthOrbitalSpeedKilometresPerHour)} km/h × age hours`, 'orbit');

  const projectedShare = state.ageDays / 365.2425 / state.expectedLifespan * 100;
  addReportItem(grid, 'Projected', `Share of a ${state.expectedLifespan}-year model`, formatPercent(projectedShare, 1), `age years ÷ ${state.expectedLifespan} × 100`, 'sliders');

  const maths = createElement('p', 'report-sheet__maths');
  maths.textContent = 'Mathematics used: calendar arithmetic, rates and ratios, percentages, unit conversion, averages, prime factorisation, probability, scientific notation, interpolation, geometry, functions and uncertainty. Exact results follow from the entered calendar date; estimates depend on visible assumptions; data comparisons stop at each source’s latest published year.';
  const sources = createElement('p', 'report-sheet__sources');
  sources.append(document.createTextNode('Compact sources: '));
  [
    ...(populationWindow.crossSeries
      ? [{ title: 'Census of India — historical population', url: populationWindow.startSeries.source.url }]
      : []),
    { title: 'World Bank — India population', url: worldData.series.indiaPopulation.source.url },
    BIOLOGY_MODEL_SOURCE,
    SPACE_SOURCES.earthAndMoon,
    SLEEP_MODEL_SOURCE,
  ].forEach((source, index, list) => {
    if (source.url) {
      const link = createElement('a', '', source.title);
      link.href = source.url; link.target = '_blank'; link.rel = 'noreferrer';
      sources.append(link);
    } else {
      sources.append(document.createTextNode(source.title));
    }
    if (index < list.length - 1) sources.append(document.createTextNode(' · '));
  });
  sources.append(document.createTextNode(` · Data accessed ${CURRENT_DATA_ACCESS_DATE}.`));
  dom.reportSheet.append(header, grid, maths, sources);
}

function downloadReport() {
  if (!state) return;
  const report = dom.reportSheet.cloneNode(true);
  report.querySelectorAll('svg, .report-sheet__mark, .report-item__icon').forEach((element) => element.remove());
  const documentTitle = `The Mathematics of You — ${displayDate(state.birth)}`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${documentTitle}</title>
<style>
@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;padding:32px;color:#171714;background:#f5f1e8;font-family:Arial,sans-serif;line-height:1.5}.report-sheet{max-width:900px;margin:auto;padding:52px;background:#fff;border-top:6px solid #2f625b}.print-title,.print-subtitle{display:block;margin:0;font-family:Georgia,serif;font-weight:400}.print-title{font-size:28px}.print-subtitle{margin-bottom:20px;font-size:16px}.report-sheet__kicker,.report-item__type{color:#69675f;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.report-sheet__header{padding-bottom:24px;border-bottom:2px solid #171714}.report-sheet__header h3{margin:2px 0;font:400 54px/1.08 Georgia,serif;letter-spacing:-.04em}.report-sheet__summary{margin:8px 0 0;color:#69675f;font-size:12px;text-transform:uppercase}.report-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 30px}.report-item{padding:20px 0;border-bottom:1px solid #d8d5ce}.report-item strong{display:block;margin:4px 0;font:400 20px/1.2 Georgia,serif}.report-item code{color:#69675f;font-size:11px;white-space:normal}.report-sheet__maths,.report-sheet__sources{margin:24px 0 0;color:#53524c;font-size:12px}a{color:inherit}@media(max-width:650px){body{padding:0;background:#fff}.report-sheet{padding:24px}.report-grid{grid-template-columns:1fr}.report-sheet__header h3{font-size:38px}}@media print{body{padding:0;background:#fff}.report-sheet{padding:0}.report-item{break-inside:avoid}}
</style></head><body>${report.outerHTML}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mathematics-of-you-${state.birthDateValue}.html`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function stopLiveTicker() {
  if (liveTicker) window.clearInterval(liveTicker);
  liveTicker = null;
  if (liveRolloverTimer) window.clearTimeout(liveRolloverTimer);
  liveRolloverTimer = null;
}

function syncLiveControl() {
  dom.toggleLiveLabel.textContent = livePaused ? 'Resume live models' : 'Pause live models';
  dom.toggleLiveIcon.setAttribute('href', livePaused ? '#icon-play' : '#icon-pause');
  document.body.classList.toggle('live-models-paused', livePaused);
  document.querySelectorAll('.stat__live-label').forEach((label) => {
    label.textContent = livePaused ? 'Paused model' : 'Live model';
  });
}

function setLivePaused(paused) {
  livePaused = Boolean(paused);
  if (livePaused) stopLiveTicker();
  syncLiveControl();
  if (!livePaused && state) startLiveTicker();
}

function setLiveStatValue(id, value, fullValue) {
  const rendered = renderedStats.get(id);
  if (!rendered) return;
  rendered.value._numericTarget = value;
  rendered.value.textContent = rendered.stat.formatter(value);
  const full = rendered.element.querySelector('.stat__full code');
  if (full && fullValue) full.textContent = fullValue;
}

function updateLiveReport(liveBody, elapsed) {
  const item = dom.reportSheet.querySelector('[data-report-stat-id="heartbeats"]');
  if (!item) return;
  const value = item.querySelector('strong');
  const formula = item.querySelector('code');
  if (value) value.textContent = `Heartbeats: ${formatCompactValue(liveBody.heartbeats)}`;
  if (formula) formula.textContent = `${formatNumber(elapsed.minutes, { maximumFractionDigits: 4 })} live minutes × ${state.body.assumptions.heartRateBpm} bpm`;
}

function updateLiveLogarithm(seconds) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  if (!wholeSeconds) return;
  const rendered = renderedStats.get('fingerprint-logarithm');
  if (!rendered) return;
  const scale = logarithmicScaleForSeconds(wholeSeconds);
  rendered.value.textContent = `10^${formatNumber(Math.log10(wholeSeconds), { maximumFractionDigits: 2 })}`;
  const full = rendered.element.querySelector('.stat__full code');
  if (full) full.textContent = scale;
  updateLiveMathDetail('fingerprint-logarithm', scale, scale);
}

function updateLiveMathDetail(id, substitution, result, variableValues = {}) {
  const current = mathDetails[id];
  if (!current) return;
  const variables = Array.isArray(current.variables)
    ? current.variables.map((variable) => (
      typeof variable === 'object' && Object.hasOwn(variableValues, variable.symbol)
        ? { ...variable, value: variableValues[variable.symbol] }
        : variable
    ))
    : current.variables;
  const next = { ...current, substitution, result, variables };
  mathDetails[id] = next;
  modal.updateDetail(id, next);
}

function updateLiveCounters(now = new Date()) {
  if (!state) return;
  if (localIsoDate(now) !== localIsoDate(state.now)) {
    const preservedModel = estimateLab ? {
      values: { ...estimateLab.values },
      sleepUserAdjusted: state.sleepUserAdjusted,
      expectedLifespan: state.expectedLifespan,
    } : null;
    const refresh = () => calculateLife(state.birthDateValue, { scroll: false, preservedModel });
    if (!modal.root.hidden) {
      stopLiveTicker();
      modal.close();
      liveRolloverTimer = window.setTimeout(refresh, 360);
    } else {
      refresh();
    }
    return;
  }

  state.now = now;
  state.elapsed = calculateLiveElapsed(state.ageDays, now);
  const elapsed = state.elapsed;
  const completedDaySeconds = elapsed.completedDaySeconds;
  const currentDaySeconds = elapsed.currentDaySeconds;
  const liveMinutes = elapsed.minutes;
  const liveBody = calculateLiveBodyCounters(state.body, elapsed);

  setLiveStatValue('time-hours', Math.floor(elapsed.hours), `${formatExact(Math.floor(elapsed.hours))} modelled hours`);
  setLiveStatValue('time-minutes', Math.floor(elapsed.minutes), `${formatExact(Math.floor(elapsed.minutes))} minutes`);
  setLiveStatValue('time-seconds', Math.floor(elapsed.seconds), `${formatExact(Math.floor(elapsed.seconds))} seconds`);
  setLiveStatValue('body-heartbeats', liveBody.heartbeats, `${formatExact(Math.floor(liveBody.heartbeats))} estimated heartbeats`);
  setLiveStatValue(
    'body-blood',
    liveBody.bloodPumpedLitres,
    `${formatNumber(liveBody.bloodPumpedLitres, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} estimated litres`,
  );
  setLiveStatValue('body-breaths', liveBody.breaths, `${formatExact(Math.floor(liveBody.breaths))} estimated breaths`);
  setLiveStatValue('body-blinks', liveBody.blinks, `${formatExact(Math.floor(liveBody.blinks))} estimated waking blinks`);
  updateLiveReport(liveBody, elapsed);
  updateLiveLogarithm(elapsed.seconds);

  updateLiveMathDetail(
    'time-hours',
    `(${formatNumber(completedDaySeconds, { maximumFractionDigits: 3 })} + ${formatNumber(currentDaySeconds, { maximumFractionDigits: 3 })}) ÷ 3,600`,
    `${formatExact(Math.floor(elapsed.hours))} hours`,
    {
      C: formatNumber(completedDaySeconds, { maximumFractionDigits: 3 }),
      T: formatNumber(currentDaySeconds, { maximumFractionDigits: 3 }),
    },
  );
  updateLiveMathDetail(
    'time-minutes',
    `(${formatNumber(completedDaySeconds, { maximumFractionDigits: 3 })} + ${formatNumber(currentDaySeconds, { maximumFractionDigits: 3 })}) ÷ 60`,
    `${formatExact(Math.floor(elapsed.minutes))} minutes`,
    {
      C: formatNumber(completedDaySeconds, { maximumFractionDigits: 3 }),
      T: formatNumber(currentDaySeconds, { maximumFractionDigits: 3 }),
    },
  );
  updateLiveMathDetail(
    'time-seconds',
    `${formatNumber(completedDaySeconds, { maximumFractionDigits: 3 })} + ${formatNumber(currentDaySeconds, { maximumFractionDigits: 3 })}`,
    `${formatExact(Math.floor(elapsed.seconds))} seconds`,
    {
      C: formatNumber(completedDaySeconds, { maximumFractionDigits: 3 }),
      T: formatNumber(currentDaySeconds, { maximumFractionDigits: 3 }),
    },
  );
  updateLiveMathDetail(
    'body-heartbeats',
    `${formatNumber(liveMinutes, { maximumFractionDigits: 4 })} × ${state.body.assumptions.heartRateBpm}`,
    `${formatExact(Math.floor(liveBody.heartbeats))} estimated heartbeats`,
    { M: formatNumber(liveMinutes, { maximumFractionDigits: 4 }) },
  );
  updateLiveMathDetail(
    'body-blood',
    `${formatNumber(liveMinutes, { maximumFractionDigits: 4 })} × ${state.body.assumptions.cardiacOutputLitresPerMinute} L/min`,
    `${formatNumber(liveBody.bloodPumpedLitres, { maximumFractionDigits: 2 })} litres`,
    { M: formatNumber(liveMinutes, { maximumFractionDigits: 4 }) },
  );
  updateLiveMathDetail(
    'body-breaths',
    `${formatNumber(liveMinutes, { maximumFractionDigits: 4 })} × ${state.body.assumptions.breathsPerMinute}`,
    `${formatExact(Math.floor(liveBody.breaths))} breaths`,
    { M: formatNumber(liveMinutes, { maximumFractionDigits: 4 }) },
  );
  updateLiveMathDetail(
    'body-blinks',
    `(${formatNumber(state.body.awakeMinutes, { maximumFractionDigits: 4 })} + ${formatNumber(elapsed.currentDayProgress, { maximumFractionDigits: 6 })} × ${formatNumber(liveBody.marginalAwakeMinutes, { maximumFractionDigits: 4 })}) × ${state.body.assumptions.blinksPerAwakeMinute}`,
    `${formatExact(Math.floor(liveBody.blinks))} blinks`,
    {
      A: formatNumber(state.body.awakeMinutes, { maximumFractionDigits: 4 }),
      p: formatNumber(elapsed.currentDayProgress, { maximumFractionDigits: 6 }),
      'Aᵈ': formatNumber(liveBody.marginalAwakeMinutes, { maximumFractionDigits: 4 }),
    },
  );

  estimateLab?.setElapsed?.({
    ageMinutes: elapsed.minutes,
    modelDays: state.ageDays + elapsed.currentDayProgress,
  });
}

function startLiveTicker() {
  stopLiveTicker();
  if (!state) return;
  if (!livePaused) liveTicker = window.setInterval(() => updateLiveCounters(new Date()), 1_000);
  updateLiveCounters(new Date());
  syncLiveControl();
}

function updateBirthdayPicker(value = dom.birthDate.value, { syncText = true } = {}) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    if (syncText) dom.birthDateText.value = '';
    dom.birthDateHint.textContent = `Type DD / MM / YYYY (${MINIMUM_BIRTH_YEAR} or later), or use the calendar`;
    dom.birthdayPicker.classList.remove('has-value');
    return;
  }
  if (syncText) dom.birthDateText.value = `${match[3]} / ${match[2]} / ${match[1]}`;
  dom.birthDateHint.textContent = `Selected: ${displayDate({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  })}. Type to edit or use the calendar button.`;
  dom.birthdayPicker.classList.add('has-value');
}

function calculateLife(dateValue, { scroll = true, preservedModel = null } = {}) {
  const now = new Date();
  const validation = validateBirthDate(dateValue, now);
  const beforeSupportedRange = validation.valid && validation.date.year < MINIMUM_BIRTH_YEAR;
  if (!validation.valid || beforeSupportedRange) {
    dom.formError.textContent = beforeSupportedRange
      ? `Enter a date on or after 1 January ${MINIMUM_BIRTH_YEAR}.`
      : validation.message || 'Enter a valid date of birth.';
    dom.formError.hidden = false;
    dom.birthDateText.setAttribute('aria-invalid', 'true');
    dom.birthDateText.focus();
    return false;
  }

  stopLiveTicker();
  dom.formError.hidden = true;
  dom.birthDateText.removeAttribute('aria-invalid');
  dom.birthDate.value = dateValue;
  updateBirthdayPicker(dateValue);
  Object.keys(mathDetails).forEach((key) => delete mathDetails[key]);
  renderedStats.clear();
  dom.story.querySelectorAll('.is-visible').forEach((element) => element.classList.remove('is-visible'));

  const birth = validation.date;
  const today = parseLocalDate(now);
  const timeSummary = buildTimeSummary(birth, now);
  const ageDays = timeSummary.completedDays;
  const elapsed = calculateLiveElapsed(ageDays, now);
  const restoredValues = preservedModel?.values || null;
  const sleepUserAdjusted = Boolean(preservedModel?.sleepUserAdjusted);
  const body = estimateBody(ageDays, bodyOverridesFromLab(restoredValues, sleepUserAdjusted));
  const expectedLifespan = Number.isFinite(preservedModel?.expectedLifespan)
    ? preservedModel.expectedLifespan
    : 80;
  if (Number.isFinite(restoredValues?.roomSize)) {
    dom.roomSize.value = restoredValues.roomSize;
    dom.roomSizeOutput.textContent = String(restoredValues.roomSize);
  }
  state = {
    now,
    today,
    birth,
    birthDateValue: dateValue,
    timeSummary,
    elapsed,
    ageDays,
    numberProperties: getNumberProperties(ageDays),
    body,
    space: calculateSpaceJourney(ageDays),
    expectedLifespan,
    sleepUserAdjusted,
  };

  try {
    localStorage.setItem(STORAGE_KEY, dateValue);
  } catch {
    // Storage can be disabled; every calculation still works entirely in memory.
  }

  renderOpening();
  renderStats(dom.timeStats, buildTimeStats());
  renderWeekdayVisual();
  renderStats(dom.bodyStats, buildBodyStats(state.body));
  dom.portraitNumber.textContent = formatExact(ageDays);
  dom.portraitBinary.textContent = state.numberProperties.binary;
  dom.portraitFactors.textContent = state.numberProperties.factorizationText;
  renderStats(dom.fingerprintStats, buildFingerprintStats());
  renderProbability(Number(dom.roomSize.value) || 23);
  renderWorldChart();
  renderStats(dom.worldStats, buildWorldStats());
  renderStats(dom.spaceStats, buildSpaceStats(state.space));

  const currentYear = Math.min(now.getFullYear(), Math.max(...timelineData.map(({ year }) => year)));
  const displayedTimelineStories = renderTimeline(dom.timelineList, timelineData, birth.year, currentYear);
  dom.timelineNote.hidden = false;
  const specialYearsText = birth.year === currentYear
    ? `your birth year, which is also ${currentYear}`
    : `your birth year (${birth.year}), the present year (${currentYear})`;
  const requiredYearStories = birth.year === currentYear ? 1 : 2;
  const lifetimeDecades = Math.floor(currentYear / 10) - Math.floor(birth.year / 10) + 1;
  const edgeDecades = Math.max(0, lifetimeDecades - (displayedTimelineStories - requiredYearStories));
  const edgeDecadeNote = edgeDecades === 0
    ? ''
    : ` The required ${birth.year === currentYear ? 'combined birth/present card represents' : 'birth and present cards represent'} ${edgeDecades === 1 ? 'the remaining edge decade' : 'the remaining edge decades'}.`;
  dom.timelineNote.textContent = `${displayedTimelineStories} distinct stories are shown: ${specialYearsText}, plus one different feature from each lifetime decade with another eligible year.${edgeDecadeNote} The offline catalogue contains a sourced story for every year from 1900 through ${currentYear}.`;

  setupEstimateLab(preservedModel);
  renderReport();
  modal.setDetails(mathDetails);
  dom.story.hidden = false;
  document.body.classList.add('has-results');
  initialiseReveals();
  startLiveTicker();

  if (scroll) {
    requestAnimationFrame(() => {
      document.querySelector('#opening').scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
      dom.openingTitle.focus({ preventScroll: true });
    });
  }
  return true;
}

function resetExperience() {
  stopLiveTicker();
  livePaused = false;
  syncLiveControl();
  estimateLab?.destroy();
  estimateLab = null;
  state = null;
  dom.story.hidden = true;
  document.body.classList.remove('has-results');
  dom.birthDate.value = '';
  dom.birthDateText.value = '';
  updateBirthdayPicker('');
  dom.roomSize.value = '23';
  dom.roomSizeOutput.textContent = '23';
  dom.formError.hidden = true;
  dom.birthDateText.removeAttribute('aria-invalid');
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else is required if storage is unavailable.
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
  dom.birthDateText.focus({ preventScroll: true });
}

dom.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const normalised = normaliseDateInput(dom.birthDateText.value);
  if (!normalised) {
    dom.formError.textContent = 'Enter your birthday as DD / MM / YYYY.';
    dom.formError.hidden = false;
    dom.birthDateText.setAttribute('aria-invalid', 'true');
    dom.birthDateText.focus();
    return;
  }
  calculateLife(normalised);
});

dom.birthDate.addEventListener('input', () => {
  updateBirthdayPicker();
  dom.birthDateText.removeAttribute('aria-invalid');
  dom.formError.hidden = true;
});

dom.birthDateText.addEventListener('input', () => {
  dom.birthDate.value = '';
  dom.birthDateText.removeAttribute('aria-invalid');
  dom.formError.hidden = true;
  dom.birthdayPicker.classList.remove('has-value');
  dom.birthDateHint.textContent = `Type DD / MM / YYYY (${MINIMUM_BIRTH_YEAR} or later), or use the calendar`;
});

dom.birthDateText.addEventListener('blur', () => {
  const normalised = normaliseDateInput(dom.birthDateText.value);
  const validation = normalised ? validateBirthDate(normalised, new Date()) : null;
  if (!validation?.valid || validation.date.year < MINIMUM_BIRTH_YEAR) return;
  dom.birthDate.value = normalised;
  updateBirthdayPicker(normalised);
});

dom.openCalendar.addEventListener('click', () => {
  if (typeof dom.birthDate.showPicker === 'function') {
    try {
      dom.birthDate.showPicker();
    } catch {
      // The native input remains usable where showPicker is unavailable or restricted.
    }
  } else {
    dom.birthDateText.focus({ preventScroll: true });
  }
});

dom.roomSize.addEventListener('input', () => {
  const value = Number(dom.roomSize.value);
  renderProbability(value);
  estimateLab?.setValue('roomSize', value);
});

dom.resetTop.addEventListener('click', resetExperience);
dom.toggleLive.addEventListener('click', () => setLivePaused(!livePaused));
dom.startAgain.addEventListener('click', resetExperience);
dom.printReport.addEventListener('click', () => window.print());
dom.downloadReport.addEventListener('click', downloadReport);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state && !livePaused) updateLiveCounters(new Date());
});

dom.birthDate.max = localIsoDate();
dom.birthDate.min = `${MINIMUM_BIRTH_YEAR}-01-01`;
try {
  const recentDate = localStorage.getItem(STORAGE_KEY);
  const recentValidation = recentDate ? validateBirthDate(recentDate, new Date()) : null;
  if (recentValidation?.valid && recentValidation.date.year >= MINIMUM_BIRTH_YEAR) dom.birthDate.value = recentDate;
} catch {
  // Privacy mode or storage restrictions simply leave the field empty.
}
updateBirthdayPicker();
