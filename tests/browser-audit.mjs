import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const { existsSync } = await import('node:fs');
const chromePath = chromeCandidates.find(existsSync);
if (!chromePath) throw new Error('Chrome or Edge was not found for the local browser audit.');

const vitePort = 4177;
const debugPort = 9337;
const externalBaseUrl = process.env.AUDIT_BASE_URL?.replace(/\/$/, '');
const baseUrl = externalBaseUrl || `http://127.0.0.1:${vitePort}`;
const outputDirectory = path.join(root, '.browser-audit');
const profileDirectory = await mkdtemp(path.join(os.tmpdir(), 'math-you-chrome-'));
await mkdir(outputDirectory, { recursive: true });

const vite = externalBaseUrl ? null : spawn(process.execPath, [
  path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  '--host', '127.0.0.1', '--port', String(vitePort),
], { cwd: root, windowsHide: true, stdio: 'ignore' });

let chrome;
let socket;
let cdp;
const exceptions = [];
const consoleProblems = [];

async function waitFor(url, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function createCdp(webSocketUrl) {
  socket = new WebSocket(webSocketUrl);
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const handler = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) handler.reject(new Error(message.error.message));
      else handler.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails.text);
    } else if (message.method === 'Runtime.consoleAPICalled'
      && ['error', 'warning'].includes(message.params.type)) {
      consoleProblems.push(message.params.args.map(({ value, description }) => value ?? description ?? '').join(' '));
    } else if (message.method === 'Log.entryAdded'
      && ['error', 'warning'].includes(message.params.entry.level)) {
      consoleProblems.push(message.params.entry.text);
    }
  };
  return {
    ready: new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    }),
    send(method, params = {}) {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
}

async function evaluate(cdp, expression, awaitPromise = true) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitForExpression(cdp, expression, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(cdp, expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

try {
  await waitFor(baseUrl);
  chrome = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profileDirectory}`,
    '--window-size=1366,900', 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });

  const targetsResponse = await waitFor(`http://127.0.0.1:${debugPort}/json`);
  const targets = await targetsResponse.json();
  const target = targets.find(({ type }) => type === 'page');
  cdp = createCdp(target.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Log.enable');
  await cdp.send('Page.navigate', { url: baseUrl });
  await waitForExpression(cdp, `document.readyState === 'complete'`);

  for (const viewport of [{ width: 375, height: 812 }, { width: 1366, height: 900 }]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.width < 600,
    });
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(outputDirectory, `landing-${viewport.width}px.png`), Buffer.from(screenshot.data, 'base64'));
  }

  const calendarControlAudit = await evaluate(cdp, `(() => {
    const nativeInput = document.querySelector('#birth-date');
    const textInput = document.querySelector('#birth-date-text');
    const button = document.querySelector('#open-calendar');
    let calls = 0;
    Object.defineProperty(nativeInput, 'showPicker', { configurable: true, value: () => { calls += 1; } });
    button.click();
    delete nativeInput.showPicker;
    return {
      opensCalendar: calls === 1,
      keyboardOperableButton: button.tagName === 'BUTTON' && !button.disabled,
      normalTextInput: textInput.type === 'text' && textInput.placeholder === 'DD / MM / YYYY',
      oneCalendarIcon: document.querySelectorAll('#birthday-picker svg').length === 1,
      exampleControlRemoved: document.querySelector('#demo-button') === null
    };
  })()`);

  await evaluate(cdp, `(() => {
    const input = document.querySelector('#birth-date-text');
    input.value = '18072011';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#birth-form').requestSubmit();
    return true;
  })()`);
  await waitForExpression(cdp, `document.body.classList.contains('has-results')`);

  const liveBefore = await evaluate(cdp, `(() => {
    const read = (id) => Number(document.querySelector(id).textContent.replace(/[^0-9.-]/g, ''));
    return {
      seconds: read('#stat-value-time-seconds'),
      heartbeats: read('#stat-value-body-heartbeats'),
      blood: read('#stat-value-body-blood'),
      breaths: read('#stat-value-body-breaths'),
      blinks: read('#stat-value-body-blinks')
    };
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 8_000));
  const liveAudit = await evaluate(cdp, `(() => {
    const read = (id) => Number(document.querySelector(id).textContent.replace(/[^0-9.-]/g, ''));
    const after = {
      seconds: read('#stat-value-time-seconds'),
      heartbeats: read('#stat-value-body-heartbeats'),
      blood: read('#stat-value-body-blood'),
      breaths: read('#stat-value-body-breaths'),
      blinks: read('#stat-value-body-blinks')
    };
    return {
      badgeCount: document.querySelectorAll('.stat__live').length,
      allAdvanced: Object.keys(after).every(key => after[key] > ${JSON.stringify(liveBefore)}[key]),
      before: ${JSON.stringify(liveBefore)},
      after
    };
  })()`);

  const pausedAt = await evaluate(cdp, `(() => {
    document.querySelector('#toggle-live').click();
    return Number(document.querySelector('#stat-value-time-seconds').textContent.replace(/[^0-9.-]/g, ''));
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 2_200));
  const pauseAudit = await evaluate(cdp, `(() => {
    const button = document.querySelector('#toggle-live');
    const frozen = Number(document.querySelector('#stat-value-time-seconds').textContent.replace(/[^0-9.-]/g, ''));
    const paused = {
      frozen: frozen === ${JSON.stringify(pausedAt)},
      noContradictoryToggleState: !button.hasAttribute('aria-pressed'),
      labelled: button.textContent.includes('Resume live models'),
      pausedClass: document.body.classList.contains('live-models-paused')
    };
    button.click();
    return paused;
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 1_200));
  pauseAudit.resumed = await evaluate(cdp, `Number(document.querySelector('#stat-value-time-seconds').textContent.replace(/[^0-9.-]/g, '')) > ${JSON.stringify(pausedAt)}`);

  const viewports = [
    { width: 375, height: 812 },
    { width: 768, height: 900 },
    { width: 1366, height: 900 },
    { width: 1920, height: 1080 },
  ];
  const results = [];
  for (const viewport of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.width < 600,
    });
    await evaluate(cdp, `document.querySelector('#opening').scrollIntoView()`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    const metrics = await evaluate(cdp, `(() => ({
      innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      visibleStory: !document.querySelector('#story').hidden,
      statCount: document.querySelectorAll('.stat').length,
      mathButtonCount: document.querySelectorAll('[data-math-id]').length,
      timelineCount: document.querySelectorAll('.timeline-entry').length,
      reportItems: document.querySelectorAll('.report-item').length,
      sectionIcons: document.querySelectorAll('.section-icon').length,
      emptyVisibleValues: [...document.querySelectorAll('.stat__value')].filter(el => !el.textContent.trim()).length
    }))()`);
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const filename = `${viewport.width}px.png`;
    await writeFile(path.join(outputDirectory, filename), Buffer.from(screenshot.data, 'base64'));
    results.push({ ...viewport, ...metrics, screenshot: filename });
  }

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1366, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await evaluate(cdp, `document.documentElement.style.scrollBehavior = 'auto'`);
  for (const sectionId of ['time', 'fingerprint', 'world', 'estimate-lab', 'report']) {
    await evaluate(cdp, `document.querySelector('#${sectionId}').scrollIntoView()`);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(outputDirectory, `section-${sectionId}.png`), Buffer.from(screenshot.data, 'base64'));
  }

  for (const liveId of ['time-seconds', 'body-heartbeats']) {
    await evaluate(cdp, `document.querySelector('[data-stat-id="${liveId}"]').scrollIntoView({ block: 'center' })`);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(outputDirectory, `live-${liveId}.png`), Buffer.from(screenshot.data, 'base64'));
  }

  await evaluate(cdp, `document.querySelector('[data-math-id="time-days"]').click()`);
  await waitForExpression(cdp, `document.querySelector('#math-sheet').classList.contains('is-open')`);
  const modalAudit = await evaluate(cdp, `(() => ({
    open: !document.querySelector('#math-sheet').hidden,
    labelled: document.querySelector('.math-sheet__panel').getAttribute('aria-labelledby') === 'math-sheet-title',
    formulaPresent: document.querySelector('.math-sheet__formula').textContent.length > 20,
    focusedInside: document.querySelector('.math-sheet__panel').contains(document.activeElement)
  }))()`);
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27,
  });
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27,
  });
  await waitForExpression(cdp, `document.querySelector('#math-sheet').hidden`);
  modalAudit.closedWithEscape = await evaluate(cdp, `document.querySelector('#math-sheet').hidden`);

  const originalHeartbeats = await evaluate(cdp, `document.querySelector('#stat-value-body-heartbeats').textContent`);
  await evaluate(cdp, `(() => {
    const input = document.querySelector('#estimate-heartRate');
    input.value = '90'; input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  const updatedHeartbeats = await evaluate(cdp, `document.querySelector('#stat-value-body-heartbeats').textContent`);

  const controlAudit = await evaluate(cdp, `(() => {
    document.querySelector('#reset-estimates').click();
    const controls = [...document.querySelectorAll('#estimate-controls input[type="range"]')];
    const defaults = controls.map(input => input.value);
    const outputTitles = [];
    for (const input of controls) {
      const next = Math.min(Number(input.max), Number(input.value) + Number(input.step));
      input.value = String(next);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      outputTitles.push(document.querySelector('#estimate-output h3')?.textContent || '');
    }
    const statusUpdated = Boolean(document.querySelector('#estimate-status').textContent.trim());
    document.querySelector('#reset-estimates').click();
    const resetControls = [...document.querySelectorAll('#estimate-controls input[type="range"]')];
    const resetToDefaults = resetControls.every((input, index) => input.value === defaults[index]);

    const timelineButtons = [...document.querySelectorAll('.timeline-demo > button')];
    timelineButtons.forEach(button => button.click());
    const timelineOpened = timelineButtons.every(button => button.getAttribute('aria-expanded') === 'true')
      && [...document.querySelectorAll('.timeline-demo .demo-stage')].every(stage => !stage.hidden);
    const customTimelineVisuals = document.querySelectorAll('.timeline-demo-svg, .demo-control-row, .prime-gap-row, .cube-equation').length;
    timelineButtons.forEach(button => button.click());
    const timelineClosed = timelineButtons.every(button => button.getAttribute('aria-expanded') === 'false');
    return {
      estimateControlCount: controls.length,
      allEstimateOutputsRendered: outputTitles.length === controls.length && outputTitles.every(Boolean),
      resetToDefaults,
      statusUpdated,
      timelineDemoCount: timelineButtons.length,
      timelineOpened,
      timelineClosed,
      customTimelineVisuals
    };
  })()`);

  const accessibilityAudit = await evaluate(cdp, `(() => ({
    mathButtonsMissingSpecificName: [...document.querySelectorAll('[data-math-id]')].filter(button => !button.getAttribute('aria-label')?.toLowerCase().includes('math')).length,
    timelineButtonsMissingSpecificName: [...document.querySelectorAll('.timeline-demo > button')].filter(button => !button.getAttribute('aria-label')?.includes('story')).length,
    probabilityStatusPresent: document.querySelector('#probability-status')?.getAttribute('role') === 'status',
    estimateStatusPresent: document.querySelector('#estimate-status')?.getAttribute('role') === 'status',
    birthTimeAbsent: !document.querySelector('#birth-time'),
    pickerLabelled: document.querySelector('label[for="birth-date-text"]')?.textContent.trim() === 'When were you born?'
  }))()`);

  const downloadAudit = await evaluate(cdp, `(async () => {
    const originalClick = HTMLAnchorElement.prototype.click;
    let captured = null;
    HTMLAnchorElement.prototype.click = function captureDownload() {
      captured = { filename: this.download, href: this.href };
    };
    document.querySelector('#download-report').click();
    HTMLAnchorElement.prototype.click = originalClick;
    const downloadedHtml = captured?.href ? await fetch(captured.href).then(response => response.text()) : '';
    return {
      buttonVisible: document.querySelector('#download-report').getClientRects().length > 0,
      filename: captured?.filename || '',
      blobUrlCreated: captured?.href?.startsWith('blob:') || false,
      selfContainedDocument: downloadedHtml.startsWith('<!doctype html>')
        && downloadedHtml.includes('<style>')
        && downloadedHtml.includes('18 July 2011')
        && !downloadedHtml.includes('<script')
        && !downloadedHtml.includes('<link rel="stylesheet"')
    };
  })()`);

  await cdp.send('Emulation.setEmulatedMedia', { media: 'print' });
  const printMetrics = await evaluate(cdp, `(() => ({
    reportVisible: getComputedStyle(document.querySelector('#report')).display !== 'none',
    otherVisibleSections: [...document.querySelectorAll('.section:not(.section--report)')].filter(el => getComputedStyle(el).display !== 'none').length,
    visibleInteractiveControls: [...document.querySelectorAll('button, input')].filter(el => getComputedStyle(el).display !== 'none' && el.getClientRects().length).length,
    printHeadingLevels: [...document.querySelectorAll('#report-sheet h1, #report-sheet h2, #report-sheet h3')].filter(el => getComputedStyle(el).display !== 'none').map(el => el.tagName)
  }))()`);
  const pdf = await cdp.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  });
  const pdfBuffer = Buffer.from(pdf.data, 'base64');
  await writeFile(path.join(outputDirectory, 'mathematical-report.pdf'), pdfBuffer);
  printMetrics.pdfBytes = pdfBuffer.byteLength;
  printMetrics.approximatePageObjects = (pdfBuffer.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;

  const privacyAudit = await evaluate(cdp, `(() => ({
    storedDate: localStorage.getItem('mathematics-of-you.birth-date'),
    storageKeys: Object.keys(localStorage).filter(key => key.startsWith('mathematics-of-you'))
  }))()`);

  await cdp.send('Emulation.setEmulatedMedia', { media: 'screen' });
  await evaluate(cdp, `document.querySelector('#start-again').click()`);
  const resetAudit = await evaluate(cdp, `(() => ({
    storyHidden: document.querySelector('#story').hidden,
    dateCleared: document.querySelector('#birth-date').value === '' && document.querySelector('#birth-date-text').value === '',
    pickerReset: !document.querySelector('#birthday-picker').classList.contains('has-value'),
    storageCleared: localStorage.getItem('mathematics-of-you.birth-date') === null,
    focusRestored: document.activeElement === document.querySelector('#birth-date-text')
  }))()`);

  const futureAudit = await evaluate(cdp, `(() => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    const value = [String(tomorrow.getDate()).padStart(2, '0'), String(tomorrow.getMonth() + 1).padStart(2, '0'), tomorrow.getFullYear()].join(' / ');
    document.querySelector('#birth-date-text').value = value;
    document.querySelector('#birth-form').requestSubmit();
    return {
      rejected: !document.querySelector('#form-error').hidden,
      message: document.querySelector('#form-error').textContent,
      invalidMarked: document.querySelector('#birth-date-text').getAttribute('aria-invalid') === 'true'
    };
  })()`);

  await evaluate(cdp, `(() => {
    const input = document.querySelector('#birth-date-text');
    input.value = '18 / 07 / 2011';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#birth-form').requestSubmit();
  })()`);
  await waitForExpression(cdp, `document.body.classList.contains('has-results')`);
  const selectedDateAudit = await evaluate(cdp, `(() => ({
    correctDate: document.querySelector('#birth-date').value === '2011-07-18',
    pickerUpdated: document.querySelector('#birthday-picker').classList.contains('has-value')
      && document.querySelector('#birth-date-hint').textContent.includes('18 July 2011'),
    exampleControlRemoved: document.querySelector('#demo-button') === null,
    hoursEstimated: document.querySelector('[data-stat-id="time-hours"] .classification').textContent.trim() === 'Estimated'
  }))()`);

  const beforeMinimumAudit = await evaluate(cdp, `(() => {
    const input = document.querySelector('#birth-date-text');
    input.value = '31 / 12 / 1899';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#birth-form').requestSubmit();
    return {
      rejected: !document.querySelector('#form-error').hidden,
      explainsMinimum: document.querySelector('#form-error').textContent.includes('1900'),
      invalidMarked: input.getAttribute('aria-invalid') === 'true'
    };
  })()`);

  await evaluate(cdp, `(() => {
    const input = document.querySelector('#birth-date-text');
    input.value = '01 / 01 / 1900';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#birth-form').requestSubmit();
  })()`);
  await waitForExpression(cdp, `document.querySelector('#opening-date').textContent.includes('1900')`);
  const coverage1900Audit = await evaluate(cdp, `(() => {
    const expectedWorldIds = [
      'world-india-population', 'world-population', 'world-internet',
      'world-electricity', 'world-co2', 'world-inflation',
      'world-purchasing-power', 'world-life-expectancy',
      'world-literacy', 'world-nifty'
    ];
    const worldStats = [...document.querySelectorAll('#world-stats .stat')];
    const allStats = [...document.querySelectorAll('.stat')];
    const definitions = [...document.querySelectorAll('#fingerprint-stats .stat__definitions')];
    const invalidOutput = /cannot be made|unavailable|NaN|undefined|Infinity/i;
    const firstDefinition = definitions[0];
    firstDefinition?.querySelector('summary')?.click();
    return {
      nativeMinimum: document.querySelector('#birth-date').min === '1900-01-01',
      hintExplainsMinimum: document.querySelector('#birth-date-hint').textContent.includes('1900'),
      correctSelectedDate: document.querySelector('#birth-date').value === '1900-01-01',
      everyWorldResultRendered: expectedWorldIds.every(id => document.querySelector('[data-stat-id="' + id + '"]')),
      everyWorldResultHasMaths: worldStats.every(stat => stat.querySelector('[data-math-id]')),
      noUnavailablePlaceholder: !document.querySelector('[data-stat-id="world-unavailable-series"], [data-stat-id="world-coverage"]')
        && !worldStats.some(stat => invalidOutput.test(stat.textContent)),
      everyNarrativeStatComplete: allStats.every(stat => stat.querySelector('.stat__value')?.textContent.trim()
        && stat.querySelector('[data-math-id]')
        && stat.querySelector('.classification')),
      noInvalidNarrativeOutput: !allStats.some(stat => invalidOutput.test(stat.querySelector('.stat__value')?.textContent || '')),
      completeReport: document.querySelectorAll('.report-item').length >= 10
        && !invalidOutput.test(document.querySelector('#report-sheet').textContent),
      definitionControlCount: definitions.length,
      definitionExpanded: Boolean(firstDefinition?.open),
      definitionTextPresent: Boolean(firstDefinition?.querySelector('dd')?.textContent.trim())
    };
  })()`);

  const audit = {
    viewports: results,
    calendarControl: calendarControlAudit,
    modal: modalAudit,
    liveCounters: liveAudit,
    livePause: pauseAudit,
    estimateLabUpdated: originalHeartbeats !== updatedHeartbeats,
    controls: controlAudit,
    accessibility: accessibilityAudit,
    download: downloadAudit,
    print: printMetrics,
    privacy: privacyAudit,
    reset: resetAudit,
    futureDateValidation: futureAudit,
    selectedDate: selectedDateAudit,
    beforeMinimumDate: beforeMinimumAudit,
    coverage1900: coverage1900Audit,
    runtimeExceptions: exceptions,
    consoleProblems,
  };
  await writeFile(path.join(outputDirectory, 'audit.json'), `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify(audit, null, 2));
  if (results.some(({ horizontalOverflow, emptyVisibleValues }) => horizontalOverflow || emptyVisibleValues)) process.exitCode = 1;
  if (Object.values(calendarControlAudit).some((value) => !value)) process.exitCode = 1;
  if (!modalAudit.closedWithEscape || !modalAudit.focusedInside || !audit.estimateLabUpdated || exceptions.length || consoleProblems.length) process.exitCode = 1;
  if (liveAudit.badgeCount !== 5 || !liveAudit.allAdvanced) process.exitCode = 1;
  if (Object.values(pauseAudit).some((value) => !value)) process.exitCode = 1;
  if (controlAudit.estimateControlCount !== 9 || !controlAudit.allEstimateOutputsRendered || !controlAudit.resetToDefaults || !controlAudit.statusUpdated || controlAudit.timelineDemoCount !== 8 || !controlAudit.timelineOpened || !controlAudit.timelineClosed || controlAudit.customTimelineVisuals < 7) process.exitCode = 1;
  if (accessibilityAudit.mathButtonsMissingSpecificName || accessibilityAudit.timelineButtonsMissingSpecificName || !accessibilityAudit.probabilityStatusPresent || !accessibilityAudit.estimateStatusPresent || !accessibilityAudit.birthTimeAbsent || !accessibilityAudit.pickerLabelled) process.exitCode = 1;
  if (!downloadAudit.buttonVisible || !downloadAudit.filename.endsWith('.html') || !downloadAudit.blobUrlCreated || !downloadAudit.selfContainedDocument) process.exitCode = 1;
  if (!printMetrics.reportVisible || printMetrics.otherVisibleSections || printMetrics.visibleInteractiveControls || printMetrics.approximatePageObjects > 2) process.exitCode = 1;
  if (printMetrics.printHeadingLevels.join(',') !== 'H1,H2,H3') process.exitCode = 1;
  if (privacyAudit.storedDate !== '2011-07-18' || privacyAudit.storageKeys.length !== 1) process.exitCode = 1;
  if (Object.values(resetAudit).some((value) => !value) || !futureAudit.rejected || !futureAudit.invalidMarked || Object.values(selectedDateAudit).some((value) => !value)) process.exitCode = 1;
  if (Object.values(beforeMinimumAudit).some((value) => !value)) process.exitCode = 1;
  if (coverage1900Audit.definitionControlCount < 10
    || Object.entries(coverage1900Audit).some(([key, value]) => key !== 'definitionControlCount' && !value)) process.exitCode = 1;
} finally {
  try {
    await cdp?.send('Browser.close');
  } catch {
    // Fall back to terminating the exact spawned browser process below.
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
  socket?.close();
  if (chrome && chrome.exitCode == null) chrome.kill();
  vite?.kill();
  await new Promise((resolve) => setTimeout(resolve, 500));
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(profileDirectory, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
      break;
    } catch (error) {
      if (attempt === 4) console.warn(`Browser profile cleanup deferred: ${error.message}`);
      else await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}
