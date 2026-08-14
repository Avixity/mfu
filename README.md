# The Mathematics of You

**Your entire life, expressed through numbers.**

The Mathematics of You is an offline-first, interactive mathematical story for a mathematics exhibition. A visitor enters a date of birth. The site turns that input into calendar arithmetic, biological models, number properties, India-focused world-data comparisons, orbital journeys, a curated mathematics-history thread, an adjustable Estimate Lab, and a printable or downloadable report.

The project is deliberately not a dashboard. It uses large editorial sentences, natural scrolling, restrained section colours, CSS/SVG illustrations, and a reusable **Show the maths** bottom sheet. Every narrative statistic exposes its classification, formula, substituted values, units, assumptions, uncertainty, and source.

## Exhibition objective

The exhibition demonstrates that familiar mathematics describes a real lifetime. Visitors encounter:

- arithmetic, rates, ratios, percentages, and unit conversion;
- calendar intervals, leap years, remainders, and fractions;
- prime factorisation, divisors, sequences, and number bases;
- probability and complementary events;
- averages, interpolation, index ratios, and percentage-point change;
- geometry, orbital motion, functions, gradients, and sensitivity;
- the difference between an exact calculation, a modelled estimate, published data, and a projection.

Results use the visitor's selected date and the device's current calendar date, while live Estimated counters also follow its clock.

## What is included

- A normal `DD / MM / YYYY` typing field for dates from **1 January 1900 through the device's current date**, with flexible separator-free input, one calendar button, safe local-date validation, and leap-day handling.
- UTC-normalised whole-day arithmetic and a live Estimated clock for seconds, heartbeats, blood flow, breaths, and blinks.
- Exact weekday, Monday, weekend-period, birthday, century, age-year, calendar-year-fraction, and meteorological-season calculations.
- Twelve clearly labelled educational body estimates, including piecewise age-banded sleep.
- A full completed-day number fingerprint: bases, Roman numerals, factorisation, divisor statistics, sequence tests, palindromic and prime milestones, digit arrangements, and a seconds-to-decades logarithmic view. Plain-language **View definitions** controls explain terms such as prime, factor, palindrome, triangular number, Fibonacci number, digital root, permutation, and logarithm in place.
- Two distinct interactive birthday probabilities for rooms of 2–100 people.
- Frozen local JSON data for India, the world, atmospheric CO2, inflation, purchasing power, literacy, life expectancy, electricity, Internet use, and the NIFTY 50. Historical benchmarks and modern annual series are stored separately so a 1900 visitor receives useful calculations without a modern record being relabelled as a 1900 measurement.
- A dependency-free SVG population chart.
- Seven space calculations using documented mean rates and periods.
- An offline catalogue with one primary sourced mathematical story for every year from 1900 through 2026, plus enough distinct bonus stories to give every decade at least ten choices. The narrative always shows the visitor's birth year and 2026, then adds a different feature for each lifetime decade with another eligible year, without repeating a story.
- An Estimate Lab with instant recalculation, a difference-from-default readout, a sensitivity curve, and a projected-lifespan model.
- An accessible reusable maths bottom sheet, a print-specific one- or two-page A4 report, and a self-contained offline HTML report download.
- Reduced-motion support, keyboard focus styles, semantic controls, and responsive layouts for phones through exhibition screens.

## Quick start

### Requirements

- Node.js **`^20.19.0` or `>=22.12.0`**. This is the engine requirement of the locked Vite 7 release.
- npm, included with Node.js.

Install the exact locked dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

The unbuilt source also works with the VS Code **Live Server** extension: open `index.html` with Live Server (commonly `http://127.0.0.1:5500/index.html`). The stylesheet is linked directly and the local JSON datasets use standard browser requests, so this route does not depend on Vite's module transforms.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm test` | Run all Vitest unit tests once. |
| `npm run test:watch` | Rerun unit tests while files change. |
| `npm run build` | Create the production bundle in `dist/`. |
| `npm run preview` | Serve the production bundle locally, normally at `http://localhost:4173`. |
| `npm run audit:browser` | Run the local headless browser audit and write screenshots plus `.browser-audit/audit.json`. |

## Production build and offline use

Prepare the machine while package installation is available:

```bash
npm ci
npm test
npm run build
```

At the exhibition, no Internet connection is required to calculate or display results. Serve the built files locally:

```bash
npm run preview -- --host 127.0.0.1
```

Then open the URL printed by Vite. The HTML, CSS, JavaScript, data, illustrations, and chart are local, and typography uses system fonts rather than a remote font service. External source links are references only; following one requires Internet access. The `dist/index.html` file should be served rather than double-clicked with a `file://` URL because the production bundle uses normal web asset paths.

There is no service worker or installable PWA. “Offline” means the prepared site runs through its local server without contacting external services.

## Exhibition mode

1. Run `npm run build` before the exhibition and start `npm run preview -- --host 127.0.0.1` on the laptop.
2. Open the preview URL in a current browser, use full-screen mode, and keep browser zoom near 100%.
3. Let each visitor type their birthday normally or use the single calendar button.
4. Open **Show the maths** beneath selected results to discuss formula, substitution, units, assumptions, uncertainty, and source.
5. Use the Estimate Lab to demonstrate direct proportion and sensitivity. Heartbeats are shown as `H(r) = age in minutes x r`; the gradient is the visitor's age in minutes.
6. Use **Download report** to save a self-contained HTML copy, or **Print report** to open the browser print dialog. Print CSS selects A4, uses 12 mm margins, removes controls and colour decoration, and keeps a compact two-column report. The print dialog can also save a PDF.
7. Select **Start again** or **Choose another date** before handing the laptop to the next visitor.

For a QR code on a private local network, serve with:

```bash
npm run preview -- --host 0.0.0.0
```

Encode the LAN URL printed by Vite, keep phones on the same local network or hotspot, and allow the local server through the computer firewall. Calculations still happen independently in each visitor's browser; this project has no backend.

## Browser audit

Run:

```bash
npm run audit:browser
```

The audit starts a temporary local Vite server, drives Chrome or Edge through the browser's debugging protocol, selects a fixed test date, and checks:

- widths of 375, 768, 1366, and 1920 pixels;
- horizontal overflow and empty statistic values;
- story, timeline, maths-button, and report rendering;
- bottom-sheet labelling, focus placement, and Escape-to-close behaviour;
- native-calendar activation, rejection before 1900, complete 1900-result coverage, expandable number-term definitions, live per-second advancement, pause/resume behaviour, and Estimate Lab rate propagation;
- uncaught runtime exceptions.

It saves viewport and section screenshots plus a JSON result in `.browser-audit/`. The script currently looks for Chrome or Edge in their standard Windows installation paths and uses local ports 4177 and 9337; see [Known limitations](#known-limitations) for portability details.

To audit an already-running Live Server instance instead, set `AUDIT_BASE_URL` before the command, for example `AUDIT_BASE_URL=http://127.0.0.1:5500 npm run audit:browser` in a compatible shell.

## Architecture

This is a lightweight Vite project using semantic HTML, CSS, and vanilla ES modules. There are no runtime packages, UI frameworks, remote fonts, animation libraries, or charting libraries.

| Path | Responsibility |
| --- | --- |
| `index.html` | Landing form, narrative section structure, report shell, and accessible maths dialog markup. |
| `src/main.js` | Application state, data-driven statistic definitions, rendering, classifications, maths-detail records, persistence, and report composition. |
| `src/styles.css` | Editorial layout, section accents, responsive rules, motion preferences, bottom sheet, SVG styling, and A4 print rules. |
| `src/calculations/date.js` | Date parsing, validation, UTC day numbers, exact calendar age, weekdays, leap days, anniversaries, and elapsed time. |
| `src/calculations/body.js` | Biological rate models, piecewise sleep, default assumptions, and illustrative sensitivity ranges. |
| `src/calculations/live.js` | Shared date-based live clock and continuously advancing biological counters. |
| `src/calculations/numbers.js` | Prime and divisor algorithms, sequence/property tests, number representations, palindromes, arrangements, and birthday probabilities. |
| `src/calculations/world.js` | Interpolation, non-extrapolating comparison-window selection, annual-series comparisons, CPI ratios, compounding, and chart coordinates. |
| `src/calculations/space.js` | Unit-safe speed, orbit, lunar-cycle, recession, and equatorial comparison calculations. |
| `src/components/math-modal.js` | Reusable data-driven bottom sheet, focus trap, Escape handling, source links, and focus restoration. |
| `src/components/timeline.js` | Birth-year, present-year, and lifetime-decade story selection; de-duplication; rendering; and lightweight “Understand it” demonstrations. |
| `src/components/estimate-lab.js` | Adjustable controls, live functions, default deltas, gradients, and SVG sensitivity charts. |
| `src/utils/format.js` | Full, compact, scientific, percent, distance, significant-digit, and unit-conversion formatting. |
| `src/utils/dom.js` | Intersection-based reveal and number animation helpers with reduced-motion handling. |
| `src/data/world-data.json` | Frozen annual observations, units, source metadata, access dates, interpolation policy, and limitations. |
| `src/data/math-timeline-1900-1949.json` | Primary sourced stories for 1900–1949, designated decade features, and optional demonstration metadata. |
| `src/data/math-timeline-1950-1999.json` | Primary sourced stories for 1950–1999, designated decade features, and optional demonstration metadata. |
| `src/data/math-timeline-2000-2026.json` | Primary sourced stories for 2000–2026, designated decade features, bonus 2020s stories, and optional demonstration metadata. |
| `tests/` | Unit tests plus the local browser audit script. |

## Calculation classifications

The classification is part of the mathematical claim, not decoration:

- **Exact**: deterministically follows from the entered date and the stated calendar or probability convention. “Exact within the simplified model” is used where the model itself is an explicit assumption, such as 365 equally likely birthdays.
- **Estimated**: multiplies elapsed time by an average rate, rounded physical constant, or modelling convention. These values are not measurements.
- **Data-based**: compares stored published observations. The site names the actual latest available year and never calls an older value “today.”
- **Projected**: explores a future or hypothetical assumption. The only projected output is the adjustable share of a modelled lifespan; it is not a prediction.

Display rounding never changes the underlying JavaScript value. Large statistics provide a **See the full value** expansion where useful.

## Formula and classification catalogue

The following tables are both the formula list and the complete classification inventory for the visitor-facing calculations. `D` is completed age in calendar days, `C` is the actual number of seconds across the completed local calendar intervals, and `T` is the actual number of seconds elapsed since local midnight. Stable whole-day models use `M = 1,440D` minutes and `S = 86,400D` seconds. Live rate models use `M_live = (C + T) / 60`; `p` is today's elapsed fraction after allowing for a 23-, 24-, or 25-hour local day. Live totals remain explicitly Estimated because no birth time is collected.

### Your Time

| Statistic | Classification | Formula or rule | Main convention |
| --- | --- | --- | --- |
| Exact calendar age | Exact | completed calendar years + completed calendar months + remaining calendar days | Calendar units are counted in that order; age is never `milliseconds / 365 days`. |
| Completed days | Exact | `UTC_day(today) - UTC_day(birth)` | Half-open interval `[birth date, current date)` avoids daylight-saving errors. |
| Hours lived | Estimated | `(C + T) / 3,600` | Live date-boundary model; uncertainty remains below 24 hours. |
| Minutes lived | Estimated | `(C + T) / 60` | Follows real elapsed time and remains monotonic across daylight-saving changes. |
| Seconds lived | Estimated | `C + T` | Visible full-value counter advances once each second. |
| Complete weeks and remainder | Exact | `D = 7 floor(D/7) + (D mod 7)` | Only whole completed dates are included. |
| Completed birthdays | Exact | completed birthdays = completed calendar years | A birthday counts after its anniversary is reached. |
| Potential school days | Estimated | `sum(days in age band / 365.2425 x school working days/year)` | Covers ages 6–17; rates are 200, 220, then 200 days/year. |
| Leap days experienced | Exact | count valid 29 February dates in `[birth, today)` | Gregorian rule: divisible by 4, except non-400-divisible century years. |
| Weekend periods | Exact | Saturdays in the interval + an initial partial Sunday, if applicable | Weekend days are Saturday + Sunday counts; the sentence reports weekend periods. |
| Mondays | Exact | complete weeks + Monday occurrences in the remainder | Includes the birth date and excludes the current incomplete date. |
| Each weekday | Exact | for each weekday: complete weeks + its occurrence in the remaining 0–6 dates | Uses UTC weekday arithmetic. |
| Century completed | Exact | `100D / days from birth to 100th birthday` | The denominator contains the actual leap days in that 100-year interval. |
| Current age-year progress | Exact | `100 x days since last birthday / days between adjacent birthdays` | The denominator is the real 365- or 366-day age-year. |
| Meteorological seasons experienced | Exact under stated convention | initial intersecting season + later 1 Mar, 1 Jun, 1 Sep, and 1 Dec boundaries | This is a four-season meteorological convention, not an India-specific climate model. |
| Fraction lived in each calendar year | Exact | `days lived inside year Y / D` | Uses exact completed-day slices; percentages are rounded only for display and are undefined at `D = 0`. |
| Age in planetary years | Estimated | `D / mean planetary orbital period in Earth days` | Uses NASA mean periods, not instantaneous orbital position. |

### Your Living Body

| Statistic | Classification | Formula | Default model |
| --- | --- | --- | --- |
| Heartbeats | Estimated | `M_live x heart rate` | 78 beats/minute; visible counter advances live. |
| Blood pumped | Estimated | `M_live x cardiac output` | 5 litres/minute; visible counter advances live. |
| Breaths | Estimated | `M_live x breathing rate` | 16 breaths/minute; visible counter advances live. |
| Blinks while awake | Estimated | `[completed awake minutes + (p x current-age awake minutes/day)] x blink rate` | 15 blinks/waking minute; today's modelled waking activity is distributed uniformly and joins continuously at midnight. |
| Time asleep | Estimated | `sum(days in age band x midpoint sleep hours/day)` | Piecewise National Sleep Foundation age bands; a Lab change substitutes one fixed rate. |
| Red blood cells produced | Estimated | `S x cells/second` | 2.4 million cells/second. |
| Hair growth | Estimated | `D x 0.35 mm/day` | One hypothetical continuously growing, never-cut scalp hair; divide by 1,000 for metres. |
| Fingernail growth | Estimated | `D x 0.1 mm/day` | One fingernail before trimming; divide by 10 for centimetres. |
| Steps walked | Estimated | `D x steps/day` | 7,000 steps/day. |
| Distance walked | Estimated | `D x steps/day x step length / 1,000` | 0.7 metres/step; output in kilometres. |
| Meals eaten | Estimated | `D x meals/day` | 3 meals/day; snacks are excluded. |
| Water consumed | Estimated | `D x litres/day` | 2 litres/day; glass comparison uses 0.25 litre/glass. |

These are educational models, not medical measurements, diagnoses, or personal health records.

### Your Mathematical Fingerprint

| Statistic | Classification | Formula or test | Convention |
| --- | --- | --- | --- |
| Decimal age | Exact | `N = D` | Ordinary base ten. |
| Binary and hexadecimal | Exact | positional conversion to bases 2 and 16 | Hexadecimal letters are uppercase. |
| Roman numeral | Exact | greedy standard Roman conversion | Deliberately supported only for integers 1–3,999. |
| Scientific notation | Exact | `N = a x 10^k`, with `1 <= abs(a) < 10` | Significant digits are chosen for a readable representation. |
| Prime/composite status | Exact | test integer divisors from 2 through `floor(sqrt(N))` | 0 and 1 are neither prime nor composite. |
| Complete prime factorisation | Exact | repeatedly divide by the smallest available prime | 0 has no prime factorisation; 1 is the empty prime product. |
| Number of factors | Exact | if `N = product(p_i^e_i)`, count = `product(e_i + 1)` | Zero has no finite positive-divisor count. |
| Sum of factors | Exact | add every positive divisor | Zero has no finite divisor sum. |
| Even or odd | Exact | even iff `N mod 2 = 0` | Tested independently of the other traits. |
| Palindrome | Exact | decimal digits equal their reversal | Uses the non-negative decimal representation. |
| Triangular number | Exact | triangular iff `8N + 1` is a perfect square | Includes zero under the utility convention. |
| Perfect square | Exact | `floor(sqrt(N))^2 = N` | Integer arithmetic. |
| Fibonacci number | Exact | `5N^2 + 4` or `5N^2 - 4` is a perfect square | Includes 0 and 1. |
| Digital root | Exact | `1 + ((N - 1) mod 9)` for `N > 0`; 0 maps to 0 | Repeated decimal digit sum in closed form. |
| Next prime age | Exact | smallest prime `P > N` | Strictly later than the current age even if `N` is prime. |
| Previous and next palindrome ages | Exact | search outward until decimal digits reverse identically | Previous can be absent at age 0. |
| Distance from 10,000 days | Exact | `10,000 - N` | The sign determines “away” or “ago.” |
| Age as a fraction of 100 years | Exact | `N / century_days`, reduced by the GCD | Uses the visitor's real birth-to-100th-birthday interval. |
| Birth-date digit arrangements | Exact | `8! / product(count_of_each_repeated_digit!)` | Digits are `YYYYMMDD`; leading zeroes remain digits and arrangements need not be valid dates. |
| Lifetime before/after 11 March 2020 | Exact | `100 x days on each side of boundary / N` | Uses WHO's pandemic-characterisation date only as a transparent boundary. At `N = 0`, the percentage is reported undefined. |
| Logarithmic lifetime from seconds to decades | Estimated | `log10(lifetime expressed in unit U)` | It uses the same date-based seconds model; each increase of 1 represents ten times as much time. |
| At least one shared pair in a room | Exact within simplified model | `1 - product from k=0 to n-1 of ((365-k)/365)` | 365 equally likely, independent birthdays; no 29 February. |
| At least one other person shares the visitor's date | Exact within simplified model | `1 - (364/365)^(n-1)` | This event is narrower than “any pair,” so its probability is lower. |

### The World During Your Lifetime

| Statistic | Classification | Formula | Data rule |
| --- | --- | --- | --- |
| India population change | Data-based | `latest population - selected starting population` | Uses the birth year when a comparable observation exists. For a 1900 visitor, the first official census during the lifetime is 1901; it is never called a 1900 count. |
| World population change | Data-based | `latest population - selected starting population` | The isolated 1900 baseline is a historical demographic estimate with a published range; modern annual values are World Bank estimates. The source change is disclosed. |
| Internet-use change in India | Data-based | `latest percentage - first comparable percentage in the lifetime window` | The series begins in 1990. Earlier visitors see a 1990-to-latest calculation labelled as a series-start comparison, reported in percentage points. |
| Electricity-access change in India | Data-based | `latest percentage - first comparable percentage in the lifetime window` | The series begins in 1993 and the latest stored year is shown explicitly. |
| Atmospheric CO2 change | Data-based | `latest annual mean - selected starting concentration` | A 1900 comparison starts with a Law Dome ice-core gas-age proxy; modern values are NOAA Mauna Loa annual means. The different sites and methods are disclosed. |
| Indian consumer-price inflation change | Data-based | `latest annual rate - first comparable annual rate in the lifetime window` | The modern series begins in 1960. This is a percentage-point endpoint comparison, not cumulative inflation. |
| Purchasing-power comparison for INR 100 | Data-based | `100 x latest CPI / selected starting CPI` | The broad calendar-year index begins in 1960; for earlier visitors the wording says that the price record starts during their lifetime. |
| Indian life-expectancy change | Data-based | `latest value - selected starting benchmark` | The early benchmark is a 1901-1911 period estimate, not an exact 1900 observation or the visitor's predicted lifespan. |
| Adult-literacy change | Data-based | `latest measured rate - first stored official rate on or after birth` | The adult 15+ series is sparse, begins in 1981, and is never interpolated. |
| NIFTY 50 year-end growth | Data-based | `(latest stored close / first stored close on or after birth - 1) x 100` | Stored endpoints begin in 2011. The comparison excludes dividends, fees, taxes, and intra-year movement; it is not presented as the visitor's investment return. |
| Population SVG coordinates | Data-based | linearly normalise year to x and value to y | The y-axis spans the displayed data range and does not start at zero. Connecting lines do not create new observations. |
| Comparison-window selection | Data-based | use birth-year point if supported; otherwise use first verified point on or after birth; if the latest release predates birth, show that dated benchmark and its data lag | Every supported date renders a source-backed card, while the wording distinguishes a true birth-year point, an interpolated point, a later series start, and a latest-only benchmark. |

The interpolation utility uses `y0 + ((x - x0) / (x1 - x0)) x (y1 - y0)` only between surrounding verified observations and only for series whose JSON policy explicitly permits it. It never extrapolates. Historical census anchors, proxy samples, period estimates, modern annual series, irregular literacy observations, and market endpoints keep their own source and method labels.

### Your Journey Through Space

| Statistic | Classification | Formula | Constant or convention |
| --- | --- | --- | --- |
| Distance around the Sun | Estimated | `107,218 km/h x 24D` | Rounded mean Earth orbital speed; current partial day omitted. |
| Earth orbits | Estimated | `D / 365.256363004` | Mean sidereal period; complete orbits use `floor(result)`. |
| Distance with the Solar System | Estimated | `220 km/s x 86,400D` | Approximate galactic speed and straight speed-times-time path length. |
| Moon sidereal orbits | Estimated | `D / 27.321661` | Mean period relative to distant stars. |
| Lunar phase cycles | Estimated | `D / 29.53059` | Mean synodic month from matching phase to matching phase. |
| Moon recession | Estimated | `(D / 365.2425) x 3.8 cm/year` | Present-day rounded laser-ranging rate projected across the lifetime. |
| Equatorial rotation comparison | Estimated | `40,075 km x D` | An equatorial point, one solar-day circumference/day; not the visitor's personal path. |

### Estimate Lab and report

| Statistic | Classification | Formula | Convention |
| --- | --- | --- | --- |
| Heartbeat, breath, fixed-sleep, blink, step, walking-distance, and water sensitivity outputs | Estimated | the corresponding live or daily-rate formula evaluated at the selected input | Heart/breath models use `M_live`; daily models use completed days plus today's elapsed fraction. Linear outputs display a gradient. |
| Birthday-room sensitivity | Exact within simplified model | `100 x (1 - (364/365)^(n-1))` | The Lab charts the visitor-specific match probability. |
| Share of a modelled lifespan | Projected | `100 x ((D + p) / 365.2425) / expected lifespan` | Default lifespan is 80 years and is adjustable from 50 to 110; it is a scenario, not a forecast. |

The mathematics timeline is curated historical content rather than a personal statistic, so the calculation label system is not applied to its story cards. At runtime, it selects the visitor's birth-year story, the 2026 present-year story, and one separate feature for each lifetime decade that contains another eligible year. The two required cards represent edge decades when no different post-birth year exists. Birth and present years are reserved before decade selection, and titles are de-duplicated, so one discovery never fills two positions. Each card still includes a source link and avoids subjective “greatest breakthrough” language.

## Assumptions and conventions

### Calendar and input

- Date-only input is parsed as calendar components, not as a browser-dependent UTC timestamp.
- Whole-day differences convert both dates to UTC day numbers, preventing local daylight-saving changes from adding or removing a day.
- Lived dates use the half-open interval `[birth date, current date)`: the birth date is included and the still-in-progress current date is excluded.
- Exact calendar age counts whole anniversaries, then whole calendar months, then remaining days.
- A 29 February birthday is treated as 28 February for anniversaries in non-leap years.
- Sub-day totals combine actual elapsed seconds across completed local calendar intervals with actual seconds since local midnight and remain Estimated.
- The shared live clock updates once per second and has a visible pause/resume control. It assumes the entered calendar date began at midnight, so it does not imply a precisely known starting instant.
- Daylight-saving transitions are handled using elapsed instants rather than displayed clock fields; the model therefore remains monotonic through repeated or skipped local times.
- Weekend “periods” mean each Saturday-started weekend plus a possible partial Sunday at the very start of life.
- The season intersecting the birth date counts first; later meteorological seasons begin on 1 March, 1 June, 1 September, and 1 December. This is a chosen mathematical convention, not a description of India's regional seasons.
- A mean Gregorian year is 365.2425 days where a physical or modelled rate requires a year conversion.

### School-day model

- School begins at age 6.
- Ages 6–10 use 200 potential working days/year, following the Right to Education norm for Classes I–V.
- Ages 11–13 use 220 potential working days/year, following the norm for Classes VI–VIII.
- Ages 14–17 use a project assumption of 200 potential working days/year; the model stops at the 18th birthday so adults do not keep accumulating fictional school days.
- Attendance, holidays, regional calendars, school changes, strikes, closures, and pandemic disruption are unknown. The result is not an attendance record.

### Biological defaults and uncertainty

| Input or output | Default | Estimate Lab range | Illustrative uncertainty band |
| --- | ---: | ---: | ---: |
| Heart rate | 78 beats/min | 45–130 | +/-20% for heartbeats |
| Cardiac output | 5 L/min | fixed | +/-30% |
| Breathing rate | 16 breaths/min | 8–30 | +/-25% |
| Blink rate while awake | 15/min | 5–30 | +/-40% |
| Sleep | piecewise age model | 5–12 h/night after adjustment | +/-15% |
| Red blood-cell production | 2.4 million/s | fixed | +/-25% |
| Hair growth | 0.35 mm/day | fixed | +/-35% |
| Fingernail growth | 0.1 mm/day | fixed | +/-35% |
| Steps | 7,000/day | 1,000–20,000 | +/-50% |
| Step length | 0.7 m | 0.35–1.10 m | included in the walking-distance +/-55% band |
| Meals | 3/day | fixed | +/-20% |
| Water | 2 L/day | 0.5–5.0 L/day | +/-40% |

The uncertainty ranges are deliberately broad sensitivity bands around the chosen mathematical model. They are not measured personal intervals, clinical reference ranges, or statistical confidence intervals. Constant lifetime rates compress age, infancy, activity, illness, environment, and individual variation.

Default sleep integrates these midpoint rates over half-open age bands:

| Age band | Hours/day |
| --- | ---: |
| 0–3 months | 15.5 |
| 4–11 months | 13.5 |
| 1–2 years | 12.5 |
| 3–5 years | 11.5 |
| 6–13 years | 10 |
| 14–17 years | 9 |
| 18–64 years | 8 |
| 65+ years | 7.5 |

The initial sleep slider value is the visitor's piecewise lifetime average rounded to one decimal place. Moving that slider intentionally replaces the age-banded integration with one visitor-selected constant rate.

### Estimate Lab controls

| Control | Default | Range | Effect |
| --- | ---: | ---: | --- |
| Average heart rate | 78 beats/min | 45–130 | Heartbeats |
| Breathing rate | 16/min | 8–30 | Breaths |
| Average sleep | age-dependent initial average | 5–12 h/night | Sleep and waking blinks |
| Waking blink rate | 15/min | 5–30 | Blinks |
| Daily steps | 7,000 | 1,000–20,000 | Steps and walking distance |
| Step length | 0.7 m | 0.35–1.10 m | Walking distance |
| Daily water | 2 L | 0.5–5.0 L | Water consumed |
| Room size | 23 people | 2–100 | Both birthday probabilities |
| Modelled lifespan | 80 years | 50–110 | Projected completed share in the report |

Resetting the Lab restores its visitor-specific defaults. Changed values update the relevant narrative statistic, the substitutions available through **Show the maths**, and the report.

### Probability, number, and historical conventions

- Birthday probabilities assume 365 equally likely, mutually independent birthdays. February 29 and real seasonal birth patterns are omitted and disclosed.
- The “any shared pair” and “someone shares your birthday” events use different complements and are never presented as interchangeable.
- Birth-date arrangements use the eight digits of `YYYYMMDD`; repeated digits divide the `8!` permutations.
- Standard Roman numeral rendering stops at 3,999 rather than inventing an extended notation.
- 11 March 2020 is used because WHO characterised COVID-19 as a pandemic on that date. It is a calculation boundary, not a claim that the pandemic began everywhere on one day.
- The offline catalogue has one primary sourced story for every year from 1900 through 2026. Complete decades contain one primary story per year; three additional 2020s entries bring that incomplete decade to ten distinct choices.
- The scrolling timeline intentionally shows a selection rather than all 127 years: the birth year, 2026, and one different story for each lifetime decade with another eligible post-birth year. The required birth or present card represents an edge decade when no different year remains. If a designated decade feature would duplicate a reserved birth or present year, selection falls back to another story from that decade.
- The 2026 entry is labelled **Mathematics in 2026 so far** because the year is incomplete.

### World-data conventions

- The offline snapshot is frozen at its recorded source values; it does not fetch updates at runtime.
- Every accepted birthday from 1900 onward produces every world-data narrative card. “Calculated” does not mean that every source measured every indicator in 1900: when a record begins later, the card calculates from the first verified observation in the visitor's lifetime and states that start year prominently.
- Each comparison uses the visitor's birth year only when a supported observation or explicitly permitted between-year interpolation exists. Otherwise it is labelled as a **series-start** comparison, never as a birth-year value.
- If a visitor is newer than an indicator's latest release, the card shows that dated latest benchmark and the number of lag years instead of claiming a zero change.
- No series is extrapolated before its first or after its latest observation.
- Each result names the actual latest stored year. Different indicators legitimately end in different years.
- Historical and modern series are kept separate in the JSON. When one visitor-facing comparison uses endpoints from different source families, the source change and resulting comparability limitation are shown in **Show the maths**.
- World Bank population values are mid-year estimates, not exact head counts. The official Indian historical values are decennial census anchors, while the 1900 world baseline is a retrospective demographic estimate with a range rather than an observed global census count.
- The 1900 CO2 point is a Law Dome ice-core proxy dated by gas age, not a direct instrument reading made in 1900. The modern endpoint comes from NOAA's Mauna Loa record.
- The early Indian life-expectancy value describes the 1901-1911 period and carries substantial historical uncertainty; it is not silently converted into an exact 1900 value.
- Internet use, electricity access, literacy, and life expectancy are published population indicators, not personal measurements.
- Percentage changes in rate indicators are expressed as percentage points.
- The INR 100 equivalence uses the World Bank calendar-year CPI ratio. The RBI CPI Combined fiscal-year series is retained for Indian-source context but is not mixed into that calculation.
- The NIFTY result compares official year-end price-index endpoints and is not investment advice or a personalised return. The 2011 value is the 30 December final-trading-day close.
- The population chart's vertical scale begins at the minimum displayed value, not zero; its caption and maths panel disclose that choice.

### Physical-space conventions

- All space totals use completed days, so the current partial day is omitted.
- Constant mean speeds and periods replace real orbital variation.
- `220 km/s` is a deliberately rounded estimate for the Solar System's galactic speed.
- Moon recession applies the contemporary `3.8 cm/year` average uniformly over the visitor's lifetime.
- The Earth-rotation result is explicitly an equatorial comparison. Actual distance depends on latitude, movement, and the distinction between solar and sidereal days.

## Data sources

**Data and source-link access date: 14 August 2026 (`2026-08-14`).** The date is stored in `src/data/world-data.json`; the timeline and methodology links were audited on the same date. The JSON snapshot stays unchanged offline for reproducibility even if a publisher later revises a value.

### Offline world-data snapshot

| Stored series | Coverage | Source |
| --- | --- | --- |
| India population, historical census anchors | 1901–2011, decennial | [Census of India: Table A-02, decadal variation in population](https://censusindia.gov.in/nada/index.php/catalog/43333) |
| India population, modern annual estimates | 1960–2025, annual | [World Bank: Population, total — India](https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN) |
| World population, historical benchmark | 1900 single estimate, with a stored 1.55–1.762 billion published range | [US Census Bureau: Historical Estimates of World Population](https://www.census.gov/data/tables/time-series/demo/international-programs/historical-est-worldpop.html) |
| World population, modern annual estimates | 1960–2025, annual | [World Bank: Population, total — World](https://data.worldbank.org/indicator/SP.POP.TOTL?locations=1W) |
| Internet use in India | 1990–2025, annual observations | [World Bank: Individuals using the Internet](https://data.worldbank.org/indicator/IT.NET.USER.ZS?locations=IN) |
| Electricity access in India | 1993–2024, annual | [World Bank: Access to electricity](https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS?locations=IN) |
| Atmospheric CO2, historical proxy | 1900 single Law Dome gas-age sample | [NOAA NCEI: Law Dome Ice Core 2000-Year greenhouse-gas data](https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=noaa-icecore-25830) |
| Atmospheric CO2, modern annual mean | 1959–2025, annual | [NOAA Global Monitoring Laboratory: Mauna Loa CO2 data](https://gml.noaa.gov/ccgg/trends/data.html) |
| India consumer price index, 2010 = 100 | 1960–2025, annual | [World Bank: Consumer price index](https://data.worldbank.org/indicator/FP.CPI.TOTL?locations=IN) |
| India consumer-price inflation | 1960–2025, annual | [World Bank: Inflation, consumer prices](https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=IN) |
| India life expectancy at birth, historical period estimates | Six published periods spanning 1901–1961 | [Government of India/MOSPI: Selected Socio-Economic Statistics India 2002](https://www.mospi.gov.in/sites/default/files/publication_reports/ssd01_2002_final.pdf) |
| India life expectancy at birth, modern annual estimates | 1960–2024, annual | [World Bank: Life expectancy at birth](https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=IN) |
| India adult literacy, ages 15+ | 1981–2024, 14 irregular observations | [World Bank: Adult literacy rate](https://data.worldbank.org/indicator/SE.ADT.LITR.ZS?locations=IN) |
| India CPI Combined, 2012 = 100 | 2011-12–2023-24 fiscal years | [RBI Handbook, Table 37: Consumer Price Index, Annual Average](https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=22511) |
| NIFTY 50 year-end price index | 2011–2025, annual endpoints | [National Stock Exchange: Historical Index Data](https://www.nseindia.com/reports-indices-historical-index-data) |

For every series, the stored JSON records observation years and values together with series-level units, source title, source URL, access date, notes, and interpolation policy. It also records historical uncertainty/range fields where available and per-value source links where the NIFTY archive requires them. A one-point historical benchmark is intentionally not treated as an annual series.

### Formula and assumption sources

- [NASA/JPL Planetary Physical Parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html) — planetary sidereal orbital periods and Earth’s equatorial radius.
- [NASA Moon by the Numbers](https://science.nasa.gov/moon/by-the-numbers/) — Earth’s mean orbital velocity.
- [NASA GSFC: Eclipses and the Moon's Orbit](https://eclipse.gsfc.nasa.gov/SEhelp/moonorbit.html) and [NASA Moon Facts](https://science.nasa.gov/moon/facts/) — precise mean lunar periods and Earth–Moon context.
- [NASA Apollo Laser Ranging Experiments](https://eclipse.gsfc.nasa.gov/SEhelp/ApolloLaser.html) — approximate contemporary lunar recession.
- [NASA Solar System Facts](https://science.nasa.gov/solar-system/solar-system-facts/) — galactic-motion context and a current order-of-magnitude comparison for the rounded 220 km/s teaching model.
- [National Sleep Foundation sleep-duration recommendations](https://doi.org/10.1016/j.sleh.2014.12.010) — age bands; the project uses each range's midpoint.
- [India Code: Right to Education Act, 2009](https://www.indiacode.nic.in/bitstream/123456789/2086/5/a2009-35.pdf) — primary and upper-primary working-day assumptions.
- [WHO remarks of 11 March 2020](https://www.who.int/news-room/speeches/item/who-director-general-s-opening-remarks-at-the-media-briefing-on-covid-19---11-march-2020) — the before/after boundary.

Most biological constants other than sleep are presented honestly as explicit educational rate assumptions rather than as personal measurements or as values from one clinical dataset. Their broad uncertainty bands and adjustable inputs are part of the lesson.

### Mathematics timeline sources

The three local timeline files contain the full citation record for every story: source title, direct source URL, people or team, field, student-level explanation, and why the result matters. The catalogue uses mathematical-history chronologies for broad historical coverage alongside original papers, journals, learned societies, universities, and international mathematics organisations. Keeping each citation beside its story makes the offline snapshot auditable without forcing 130 source links into this README.

The designated decade features below are the first choice for the concise runtime timeline. When one is already being used as the visitor's birth-year or present-year story, the selector chooses a different sourced entry from that decade.

| Decade | Designated feature | Source |
| ---: | --- | --- |
| 1900s | A simple curve grows to infinite length | [Acta Mathematica](https://doi.org/10.1007/BF02418570) |
| 1910s | How little space can a turning needle use? | [MacTutor History of Mathematics](https://mathshistory.st-andrews.ac.uk/Chronology/29/) |
| 1920s | A cube becomes a one-dimensional sponge | [London Mathematical Society](https://www.lms.ac.uk/sites/default/files/Mathematics/MPU/summer_exhibition07.pdf) |
| 1930s | Two forbidden networks explain every crossing | [Historia Mathematica](https://doi.org/10.1016/0315-0860(85)90045-X) |
| 1940s | Information becomes a measurable quantity | [MacTutor History of Mathematics](https://mathshistory.st-andrews.ac.uk/Chronology/32/) |
| 1950s | A sphere can be smooth in more than one way | [MacTutor History of Mathematics](https://mathshistory.st-andrews.ac.uk/Chronology/33/) |
| 1960s | The continuum hypothesis is independent | [MacTutor History of Mathematics](https://mathshistory.st-andrews.ac.uk/Chronology/34/) |
| 1970s | Four colours are enough | [MacTutor History of Mathematics](https://mathshistory.st-andrews.ac.uk/Chronology/35/) |
| 1980s | The Mordell conjecture is proved | [MacTutor History of Mathematics](https://mathshistory.st-andrews.ac.uk/Chronology/36/) |
| 1990s | Fermat's Last Theorem is proved | [MacTutor History of Mathematics](https://mathshistory.st-andrews.ac.uk/Chronology/37/) |
| 2000s | Prime numbers contain patterns of any length | [Ben Green and Terence Tao](https://arxiv.org/abs/math/0404188) |
| 2010s | The densest packing in eight dimensions | [Annals of Mathematics](https://annals.math.princeton.edu/2017/185-3/p07) |
| 2020s | One tile that can never repeat | [Combinatorial Theory](https://doi.org/10.5070/C64163843) |

## Privacy

- All input validation, calculations, charts, and report generation run in the browser.
- There is no backend, account, analytics package, advertising script, cookie, or remote API call.
- Only the most recent **date** is stored, under the localStorage key `mathematics-of-you.birth-date`, so the form can be conveniently restored on that same browser.
- **Choose another date** and **Start again** remove the stored date and clear the current result state.
- If localStorage is disabled, the experience still works in memory.
- The date is not placed in the URL. Source links use `rel="noreferrer"` and open only when the visitor chooses them.

## Testing

The unit suite currently contains **58 tests across seven files**:

- Gregorian leap years, impossible and future dates, UTC whole-day differences, exact calendar age, 29 February anniversaries, weekday/leap-day counts, date-based sub-day modelling, and century percentages;
- prime detection, complete prime factorisation, divisor count/sum, palindromes, triangular/square/Fibonacci tests, digital roots, Roman numerals, special-number milestones, digit arrangements, and both birthday probabilities;
- biological units, piecewise sleep, Lab overrides, invalid inputs, and uncertainty ranges;
- live time-of-day conversion, newborn sleep, biological counter-rate propagation, DST transitions, and midnight continuity;
- orbital distance, Earth/Moon/galactic calculations, lunar recession, interpolation without extrapolation, honest comparison-window modes for pre-series and post-release birthdays, fiscal-year labels, CPI ratios, compound inflation, number formatting, scientific notation, rounding, and compatible unit conversions;
- metadata and finite comparison-window coverage for every stored world series for a 1900 birthday, including explicit tests that the 1901 Indian census anchor and ranged 1900 world-population estimate are not mislabelled as exact 1900 measurements.
- complete 1900–2026 timeline coverage, at least ten distinct stories per decade, designated features, retained teaching interactions, and duplicate-free birth/present/decade selection.

Run the automated checks with:

```bash
npm test
npm run build
npm run audit:browser
```

The checked-in cases include birthdays on 1 January 1900, 18 July 2011, 29 February 2012, and 1 January 2000. Date-arithmetic tests use 14 August 2026 as a fixed “today,” and the browser audit also checks invalid pre-1900 and future inputs.

## Known limitations

- The supported input range begins on 1 January 1900. Earlier dates are rejected because the project does not promise researched world-data coverage before that boundary.
- The stored indicators stop in 2024 or 2025, while RBI fiscal-year context stops at 2023-24. They are described by those years, not as 2026 values.
- The snapshot can become stale or be revised upstream. Updating it is a deliberate research task; the application never silently fetches newer values.
- A result card is guaranteed for each supported world topic, but several records begin after 1900. Internet, electricity, CPI/inflation, adult literacy, and NIFTY cards for earlier visitors start at the first verified stored observation during that lifetime; they do not claim to measure the birth year.
- Historical and modern endpoints sometimes use different methods: decennial census versus mid-year estimate, retrospective world-population estimate versus modern annual estimate, ice-core proxy versus atmospheric monitoring, or historical period life table versus modern modelled series. Those changes limit strict comparability and are disclosed in the card and maths sheet.
- Literacy is sparse and never interpolated. NIFTY is restricted to stored annual endpoints.
- Hours, minutes, seconds and their logarithmic view are live date-based models rather than precise personal clock readings; their maths sheets state the resulting uncertainty.
- Biological values are simplified educational models. Most defaults are project assumptions rather than separately sourced medical averages; the uncertainty bands are illustrative, not statistically calibrated.
- School days are timetable potential, not attendance. The fixed season definition is not an India-specific climate calendar.
- Birthday probabilities ignore leap day and non-uniform birth rates.
- Physical journey values use rounded mean rates, omit the current partial day, and do not model elliptical orbits, changing galactic velocity, or a visitor's latitude.
- The expected-lifespan percentage is a scenario only. It must not be interpreted as lifespan or health advice.
- Roman numerals are limited to 1–3,999.
- The catalogue begins in 1900, matching the supported birthday range; it does not claim coverage before that year. The runtime timeline is intentionally selective, every story is a representative mathematical development rather than a claim about the decade's “greatest” result, and the 2026 card describes the year only so far. Interactive illustrations are teaching analogies, not proofs.
- The browser audit's Chrome/Edge discovery is currently Windows-specific and assumes standard installation paths. Unit tests and the site itself are cross-platform.
- The production build needs a local HTTP server; direct `file://` opening is not supported. External citations naturally cannot be opened while disconnected.
- Print pagination and printer margins can vary slightly by browser and printer, although the stylesheet targets one or two A4 pages.
- Calendar-year lifetime shares use completed dates only, so the still-in-progress current date is not part of any slice until it is complete.
- Compact report items show their formulas directly; the reusable **Show the maths** interaction belongs to the scrolling narrative statistics, probabilities, and chart.
