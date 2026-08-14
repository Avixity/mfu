const CONTROL_DEFINITIONS = [
  { key: 'heartRate', label: 'Average heart rate', min: 45, max: 130, step: 1, unit: 'beats/min' },
  { key: 'breathRate', label: 'Breathing rate', min: 8, max: 30, step: 1, unit: 'breaths/min' },
  { key: 'sleepHours', label: 'Average sleep', min: 5, max: 12, step: 0.1, unit: 'hours/night' },
  { key: 'blinkRate', label: 'Blinks while awake', min: 5, max: 30, step: 1, unit: 'blinks/min' },
  { key: 'stepsPerDay', label: 'Steps walked', min: 1000, max: 20000, step: 250, unit: 'steps/day' },
  { key: 'stepLength', label: 'Average step length', min: 0.35, max: 1.1, step: 0.05, unit: 'metres' },
  { key: 'waterLitres', label: 'Water consumed', min: 0.5, max: 5, step: 0.1, unit: 'litres/day' },
  { key: 'roomSize', label: 'Birthday room size', min: 2, max: 100, step: 1, unit: 'people' },
  { key: 'expectedLifespan', label: 'Modelled lifespan', min: 50, max: 110, step: 1, unit: 'years' },
];

function formatControlValue(value, definition) {
  const digits = definition.step < 1 ? 2 : 0;
  return `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: digits })} ${definition.unit}`;
}

function compact(value) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

export class EstimateLab {
  constructor({ controlsRoot, outputRoot, resetButton, defaults, ageDays, ageMinutes, modelDays, onChange, onModel }) {
    this.controlsRoot = controlsRoot;
    this.outputRoot = outputRoot;
    this.resetButton = resetButton;
    this.defaults = { ...defaults };
    this.values = { ...defaults };
    this.ageDays = ageDays;
    this.ageMinutes = ageMinutes;
    this.modelDays = modelDays ?? ageDays;
    this.onChange = onChange;
    this.onModel = onModel;
    this.lastKey = 'heartRate';
    this.renderControls();
    this.renderOutput();
    this.handleReset = () => this.reset();
    resetButton.addEventListener('click', this.handleReset);
  }

  renderControls() {
    this.controlsRoot.replaceChildren();
    for (const definition of CONTROL_DEFINITIONS) {
      const wrapper = document.createElement('div');
      wrapper.className = 'lab-control';
      const label = document.createElement('label');
      const id = `estimate-${definition.key}`;
      label.htmlFor = id;
      label.append(document.createTextNode(definition.label));
      const output = document.createElement('output');
      output.htmlFor = id;
      output.textContent = formatControlValue(this.values[definition.key], definition);
      label.append(output);
      const input = document.createElement('input');
      input.type = 'range';
      input.id = id;
      input.min = definition.min;
      input.max = definition.max;
      input.step = definition.step;
      input.value = this.values[definition.key];
      input.dataset.key = definition.key;
      input.addEventListener('input', () => {
        this.values[definition.key] = Number(input.value);
        output.textContent = formatControlValue(this.values[definition.key], definition);
        this.lastKey = definition.key;
        this.renderOutput(true);
        this.onChange?.(definition.key, this.values[definition.key], { ...this.values });
      });
      const hint = document.createElement('small');
      hint.textContent = `Default: ${formatControlValue(this.defaults[definition.key], definition)}`;
      wrapper.append(label, input, hint);
      this.controlsRoot.append(wrapper);
    }
  }

  modelFor(key, value = this.values[key]) {
    const days = this.modelDays;
    const minutes = this.ageMinutes;
    const models = {
      heartRate: {
        title: 'Estimated lifetime heartbeats',
        value: minutes * value,
        unit: 'heartbeats',
        formula: `H(r) = ${Math.round(minutes).toLocaleString('en-IN')} × r`,
        gradient: minutes,
      },
      breathRate: {
        title: 'Estimated lifetime breaths',
        value: minutes * value,
        unit: 'breaths',
        formula: `B(r) = ${Math.round(minutes).toLocaleString('en-IN')} × r`,
        gradient: minutes,
      },
      sleepHours: {
        title: 'Modelled lifetime sleep',
        value: days * value,
        unit: 'hours',
        formula: `S(h) = ${days.toLocaleString('en-IN', { maximumFractionDigits: 4 })} × h`,
        gradient: days,
      },
      blinkRate: {
        title: 'Estimated waking blinks',
        value: days * Math.max(0, 24 - this.values.sleepHours) * 60 * value,
        unit: 'blinks',
        formula: `L(b) = modelled days × waking hours × 60 × b`,
        gradient: days * Math.max(0, 24 - this.values.sleepHours) * 60,
      },
      stepsPerDay: {
        title: 'Estimated lifetime steps',
        value: days * value,
        unit: 'steps',
        formula: `W(s) = ${days.toLocaleString('en-IN', { maximumFractionDigits: 4 })} × s`,
        gradient: days,
      },
      stepLength: {
        title: 'Estimated walking distance',
        value: days * this.values.stepsPerDay * value / 1000,
        unit: 'kilometres',
        formula: `D(ℓ) = modelled days × steps/day × ℓ ÷ 1,000`,
        gradient: days * this.values.stepsPerDay / 1000,
      },
      waterLitres: {
        title: 'Estimated water consumed',
        value: days * value,
        unit: 'litres',
        formula: `V(w) = ${days.toLocaleString('en-IN', { maximumFractionDigits: 4 })} × w`,
        gradient: days,
      },
      roomSize: {
        title: 'Chance someone shares your birthday',
        value: (1 - (364 / 365) ** (value - 1)) * 100,
        unit: 'percent',
        formula: `P(n) = [1 − (364 ÷ 365)^(n − 1)] × 100`,
        gradient: null,
      },
      expectedLifespan: {
        title: 'Share of a modelled lifespan',
        value: (days / 365.2425 / value) * 100,
        unit: 'percent',
        formula: `E(L) = age in years ÷ L × 100`,
        gradient: null,
      },
    };
    return models[key];
  }

  renderOutput(animate = false) {
    const model = this.modelFor(this.lastKey);
    const defaultModel = this.modelFor(this.lastKey, this.defaults[this.lastKey]);
    const delta = model.value - defaultModel.value;
    const definition = CONTROL_DEFINITIONS.find(({ key }) => key === this.lastKey);
    this.outputRoot.replaceChildren();

    const classification = document.createElement('span');
    classification.className = 'classification';
    classification.textContent = this.lastKey === 'expectedLifespan'
      ? 'Projected'
      : this.lastKey === 'roomSize' ? 'Exact' : 'Estimated';
    const heading = document.createElement('h3');
    heading.textContent = model.title;
    const value = document.createElement('strong');
    value.className = 'lab-output__value';
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      value.animate?.([{ opacity: 0.35, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
    }
    value.textContent = model.unit === 'percent' ? `${model.value.toFixed(2)}%` : compact(model.value);
    const unit = document.createElement('p');
    unit.textContent = model.unit === 'percent'
      ? (this.lastKey === 'roomSize' ? 'for this room size' : 'of the modelled lifespan')
      : model.unit;
    const deltaText = document.createElement('p');
    deltaText.className = 'lab-output__delta';
    if (Math.abs(delta) < 1e-9) deltaText.textContent = 'This is the default model.';
    else deltaText.textContent = `${delta > 0 ? '+' : '−'}${compact(Math.abs(delta))} from the default model result.`;
    const formula = document.createElement('p');
    formula.className = 'lab-output__formula';
    formula.textContent = model.formula;

    const chart = this.buildChart(definition, model);
    const lesson = document.createElement('p');
    lesson.className = 'lab-output__lesson';
    lesson.textContent = model.gradient == null
      ? (this.lastKey === 'roomSize'
        ? 'Each additional person is one more chance to match your date; the no-match probability shrinks multiplicatively.'
        : 'This is a projection, not a prediction. Increasing the assumed lifespan reduces the completed percentage nonlinearly.')
        : `This direct-proportion model has gradient ${compact(model.gradient)} ${model.unit} for each +1 ${definition.unit} in the assumption.`;
    const mathButton = document.createElement('button');
    mathButton.type = 'button';
    mathButton.className = 'math-link';
    mathButton.dataset.mathId = 'estimate-lab-model';
    mathButton.textContent = 'Show the maths';
    mathButton.setAttribute('aria-label', `Show the maths for ${model.title}`);
    this.outputRoot.append(classification, heading, value, unit, deltaText, formula, chart, lesson, mathButton);
    this.onModel?.({
      key: this.lastKey,
      model,
      definition,
      inputValue: this.values[this.lastKey],
      defaultValue: this.defaults[this.lastKey],
      values: { ...this.values },
    });
  }

  buildChart(definition, currentModel) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'sensitivity-chart');
    svg.setAttribute('viewBox', '0 0 420 190');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${currentModel.title} sensitivity from minimum to maximum ${definition.label.toLowerCase()}`);
    const axisX = document.createElementNS(svg.namespaceURI, 'line');
    axisX.setAttribute('x1', '30'); axisX.setAttribute('x2', '400'); axisX.setAttribute('y1', '165'); axisX.setAttribute('y2', '165');
    const axisY = document.createElementNS(svg.namespaceURI, 'line');
    axisY.setAttribute('x1', '30'); axisY.setAttribute('x2', '30'); axisY.setAttribute('y1', '20'); axisY.setAttribute('y2', '165');
    const samples = [];
    for (let i = 0; i <= 20; i += 1) {
      const input = definition.min + (definition.max - definition.min) * i / 20;
      samples.push(this.modelFor(definition.key, input).value);
    }
    const low = Math.min(...samples);
    const high = Math.max(...samples);
    const points = samples.map((sample, index) => {
      const x = 30 + index / 20 * 370;
      const y = 165 - (sample - low) / Math.max(1e-12, high - low) * 135;
      return [x, y];
    });
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '));
    const currentX = 30 + (this.values[definition.key] - definition.min) / (definition.max - definition.min) * 370;
    const currentY = 165 - (currentModel.value - low) / Math.max(1e-12, high - low) * 135;
    const point = document.createElementNS(svg.namespaceURI, 'circle');
    point.setAttribute('cx', String(currentX)); point.setAttribute('cy', String(currentY)); point.setAttribute('r', '6');
    svg.append(axisX, axisY, path, point);
    return svg;
  }

  setValue(key, value, notify = false) {
    const input = this.controlsRoot.querySelector(`[data-key="${key}"]`);
    if (!input) return;
    input.value = value;
    this.values[key] = Number(value);
    const definition = CONTROL_DEFINITIONS.find((item) => item.key === key);
    input.parentElement.querySelector('output').textContent = formatControlValue(this.values[key], definition);
    if (this.lastKey === key) this.renderOutput();
    if (notify) this.onChange?.(key, this.values[key], { ...this.values });
  }

  setElapsed({ ageMinutes, modelDays }) {
    if (Number.isFinite(ageMinutes) && ageMinutes >= 0) this.ageMinutes = ageMinutes;
    if (Number.isFinite(modelDays) && modelDays >= 0) this.modelDays = modelDays;
  }

  reset() {
    this.values = { ...this.defaults };
    this.lastKey = 'heartRate';
    this.renderControls();
    this.renderOutput(true);
    this.onChange?.('reset', null, { ...this.values });
  }

  destroy() {
    this.resetButton.removeEventListener('click', this.handleReset);
  }
}
