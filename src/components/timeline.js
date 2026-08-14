function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function primeDemo(stage) {
  const row = element('div', 'prime-gap-row');
  const isPrime = (n) => {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i += 1) if (n % i === 0) return false;
    return true;
  };
  for (let n = 2; n <= 31; n += 1) {
    const prime = isPrime(n);
    const dot = element('span', `prime-dot${prime ? ' is-prime' : ''}`, `${n}${prime ? '*' : ''}`);
    dot.setAttribute('aria-label', `${n}, ${prime ? 'prime' : 'composite'}`);
    row.append(dot);
  }
  stage.append(row, element('p', '', 'An asterisk marks each prime. The gaps vary, yet some prime pairs keep appearing surprisingly close together.'));
}

function cubesDemo(stage) {
  const equation = element('div', 'cube-equation');
  equation.textContent = '(-80,538,738,812,075,974)³ + 80,435,758,145,817,515³ + 12,602,123,297,335,631³ = 42';
  stage.append(equation);
}

function packingDemo(stage) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 260 100');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Two-dimensional analogy showing circles packed closely');
  svg.style.width = '100%';
  svg.style.maxHeight = '9rem';
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(24 + col * 35 + (row % 2 ? 17.5 : 0)));
      circle.setAttribute('cy', String(20 + row * 30));
      circle.setAttribute('r', '15');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', 'currentColor');
      svg.append(circle);
    }
  }
  stage.append(svg, element('p', '', 'This flat picture is only an analogy: Viazovska solved the far harder packing question in eight dimensions.'));
}

function knotDemo(stage, item) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'timeline-demo-svg');
  svg.setAttribute('viewBox', '0 0 300 150');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', item.demo.caption);
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', item.demo.variant === 'conway'
    ? 'M38 78 C38 22 118 18 144 61 C169 102 220 126 260 90 C289 63 256 24 215 36 C164 52 165 127 111 129 C54 131 37 96 65 68 C92 41 135 62 163 83 C190 103 224 94 236 70'
    : 'M35 78 C35 25 105 18 135 55 C167 94 208 133 258 103 C294 81 272 34 230 38 C181 43 173 121 117 126 C60 131 32 100 58 69 C83 40 127 53 160 80 C191 106 226 101 248 75');
  svg.append(path);
  stage.append(svg, element('p', '', item.demo.caption));
}

function signSequenceDemo(stage, item) {
  const controls = element('div', 'demo-control-row');
  const status = element('p', 'demo-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const renderStep = (step) => {
    let sum = 0;
    const terms = item.demo.sequence.filter((_, index) => (index + 1) % step === 0);
    const running = terms.map((term) => {
      sum += term;
      return sum;
    });
    status.textContent = `Every ${step}${step === 1 ? 'st' : step === 2 ? 'nd' : 'rd'} term: ${terms.map((term) => term > 0 ? '+1' : '−1').join(', ')}. Running sums: ${running.join(', ')}.`;
    controls.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.step) === step)));
  };
  [1, 2, 3].forEach((step) => {
    const button = element('button', 'demo-chip', `Step ${step}`);
    button.type = 'button';
    button.dataset.step = String(step);
    button.addEventListener('click', () => renderStep(step));
    controls.append(button);
  });
  stage.append(controls, status, element('p', '', item.demo.caption));
  renderStep(1);
}

function tilingDemo(stage, item) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'timeline-demo-svg');
  svg.setAttribute('viewBox', '0 0 320 150');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'A small illustrative patch of rotated hat-like tile outlines');
  const points = '0,18 18,18 27,3 45,13 63,3 72,18 63,33 72,48 54,48 45,63 27,53 9,63 9,43 0,33';
  const transforms = [
    'translate(20 18)', 'translate(92 4) rotate(30 36 32)', 'translate(172 23) rotate(-20 36 32)',
    'translate(55 78) rotate(180 36 32)', 'translate(139 79) rotate(150 36 32)', 'translate(226 73) rotate(205 36 32)',
  ];
  transforms.forEach((transform) => {
    const polygon = document.createElementNS(svg.namespaceURI, 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('transform', transform);
    svg.append(polygon);
  });
  stage.append(svg, element('p', '', `${item.demo.caption} This finite sketch illustrates rotation only; the proof of non-repetition concerns every complete tiling of the infinite plane.`));
}

function kakeyaDemo(stage, item) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'timeline-demo-svg');
  svg.setAttribute('viewBox', '0 0 300 150');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Many equal line segments pointing in different directions through a compact region');
  const count = Number(item.demo.directions) || 12;
  for (let index = 0; index < count; index += 1) {
    const angle = Math.PI * index / count;
    const x = Math.cos(angle) * 100;
    const y = Math.sin(angle) * 58;
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', String(150 - x)); line.setAttribute('y1', String(75 - y));
    line.setAttribute('x2', String(150 + x)); line.setAttribute('y2', String(75 + y));
    svg.append(line);
  }
  stage.append(svg, element('p', '', item.demo.caption));
}

function genericDemo(stage, item) {
  stage.append(element('p', '', item.demo?.caption || item.demo?.text || 'This story connects a simple question with deep mathematical structure. Follow the source to explore the full result.'));
}

function buildDemo(item) {
  if (!item.demo) return null;
  const wrapper = element('div', 'timeline-demo');
  const button = element('button', 'text-button', 'Understand it');
  button.type = 'button';
  button.setAttribute('aria-label', `Understand the ${item.year} story: ${item.title}`);
  button.setAttribute('aria-expanded', 'false');
  const stage = element('div', 'demo-stage');
  stage.hidden = true;
  const id = `timeline-demo-${item.year}`;
  stage.id = id;
  button.setAttribute('aria-controls', id);
  button.addEventListener('click', () => {
    const willOpen = stage.hidden;
    stage.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
    button.textContent = willOpen ? 'Hide explanation' : 'Understand it';
    button.setAttribute('aria-label', `${willOpen ? 'Hide' : 'Understand'} the ${item.year} story: ${item.title}`);
  });

  const type = item.demo.type?.toLowerCase() || '';
  if (type.includes('prime')) primeDemo(stage);
  else if (type.includes('cube') || item.year === 2019) cubesDemo(stage);
  else if (type.includes('pack') || item.year === 2016) packingDemo(stage);
  else if (type.includes('knot')) knotDemo(stage, item);
  else if (type.includes('sign')) signSequenceDemo(stage, item);
  else if (type.includes('tiling')) tilingDemo(stage, item);
  else if (type.includes('kakeya')) kakeyaDemo(stage, item);
  else genericDemo(stage, item);
  wrapper.append(button, stage);
  return wrapper;
}

function preferredYearEntry(timeline, year) {
  const matches = timeline.filter((item) => Number(item.year) === Number(year));
  return matches.find((item) => item.birthYearDefault !== false) || matches[0] || null;
}

function storyKey(item) {
  return String(item.title).trim().toLowerCase();
}

/**
 * Keep the long-form timeline concise while guaranteeing that the visitor's
 * exact birth year and the present year are represented. Each lifetime decade
 * also receives one different story; a designated decade feature is preferred,
 * with a midpoint-near fallback when that feature would duplicate a special year.
 */
export function selectTimelineEntries(timeline, birthYear, currentYear = new Date().getFullYear()) {
  if (!Array.isArray(timeline)) throw new TypeError('Timeline data must be an array.');
  const startYear = Math.trunc(Number(birthYear));
  const endYear = Math.trunc(Number(currentYear));
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear) || startYear > endYear) return [];

  const eligible = timeline
    .filter((item) => Number.isInteger(Number(item.year)) && item.year >= startYear && item.year <= endYear)
    .sort((first, second) => first.year - second.year || String(first.title).localeCompare(String(second.title)));
  const chosen = [];
  const usedStories = new Set();
  const usedItems = new Set();
  const reservedYears = new Set([startYear, endYear]);

  const add = (item, role, roleLabel) => {
    if (!item) return false;
    const key = storyKey(item);
    const itemKey = `${item.year}|${key}`;
    if (usedStories.has(key) || usedItems.has(itemKey)) return false;
    usedStories.add(key);
    usedItems.add(itemKey);
    chosen.push({ ...item, timelineRole: role, timelineRoleLabel: roleLabel });
    return true;
  };

  const birthEntry = preferredYearEntry(eligible, startYear);
  const presentEntry = preferredYearEntry(eligible, endYear);
  if (startYear === endYear) {
    add(birthEntry || presentEntry, 'birth-present', 'Your birth year · Present year');
  } else {
    add(birthEntry, 'birth', 'Your birth year');
    add(presentEntry, 'present', 'Present year');
  }

  const firstDecade = Math.floor(startYear / 10) * 10;
  const lastDecade = Math.floor(endYear / 10) * 10;
  for (let decade = firstDecade; decade <= lastDecade; decade += 10) {
    const midpoint = decade + 5;
    const candidates = eligible
      .filter((item) => item.year >= decade && item.year <= decade + 9 && !reservedYears.has(item.year) && !usedStories.has(storyKey(item)))
      .sort((first, second) => {
        if (Boolean(first.decadeFeature) !== Boolean(second.decadeFeature)) return first.decadeFeature ? -1 : 1;
        if (Boolean(first.birthYearDefault !== false) !== Boolean(second.birthYearDefault !== false)) {
          return first.birthYearDefault !== false ? -1 : 1;
        }
        return Math.abs(first.year - midpoint) - Math.abs(second.year - midpoint) || first.year - second.year;
      });
    add(candidates[0], 'decade', `${decade}s`);
  }

  return chosen.sort((first, second) => first.year - second.year || first.timelineRole.localeCompare(second.timelineRole));
}

export function renderTimeline(container, timeline, birthYear, currentYear = new Date().getFullYear()) {
  container.replaceChildren();
  const entries = selectTimelineEntries(timeline, birthYear, currentYear);
  for (const item of entries) {
    const article = element('article', 'timeline-entry reveal');
    article.append(element('div', 'timeline-entry__year', String(item.year)));
    const content = element('div', 'timeline-entry__content');
    content.append(
      element('p', 'timeline-entry__role', item.timelineRoleLabel),
      element('p', 'timeline-entry__kicker', item.label || (item.year === 2026 ? 'Mathematics in 2026 so far' : `A mathematical story from ${item.year}`)),
      element('h3', '', item.title),
      element('p', 'timeline-entry__people', item.people || item.mathematician || item.team),
      element('p', 'timeline-entry__explanation', item.explanation),
      element('p', 'timeline-entry__matters', `Why it matters: ${item.whyItMatters}`),
    );
    const meta = element('div', 'timeline-entry__meta');
    meta.append(element('span', 'timeline-entry__field', item.field));
    const source = element('a', '', item.sourceTitle || item.source?.title || 'Read the source');
    source.href = item.sourceUrl || item.source?.url;
    source.target = '_blank';
    source.rel = 'noreferrer';
    meta.append(source);
    content.append(meta);
    const demo = buildDemo(item);
    if (demo) content.append(demo);
    article.append(content);
    container.append(article);
  }
  return entries.length;
}
