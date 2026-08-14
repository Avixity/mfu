const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function appendTextElement(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function normaliseList(value) {
  if (value == null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

export class MathModal {
  constructor(root) {
    this.root = root;
    this.panel = root.querySelector('.math-sheet__panel');
    this.content = root.querySelector('#math-sheet-content');
    this.details = new Map();
    this.returnFocus = null;
    this.currentId = null;
    this.closeTimer = null;

    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-math]')) this.close();
    });

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-math-id]');
      if (!button) return;
      const detail = this.details.get(button.dataset.mathId);
      if (detail) this.open(detail, button);
    });

    document.addEventListener('keydown', (event) => this.onKeyDown(event));
  }

  setDetails(items) {
    this.details.clear();
    for (const [id, detail] of Object.entries(items)) this.details.set(id, detail);
  }

  updateDetail(id, detail) {
    this.details.set(id, detail);
    if (this.currentId !== id || this.root.hidden) return;

    const formula = this.content.querySelector('.math-sheet__formula');
    if (formula) {
      formula.textContent = `Formula\n${detail.formula}\n\nSubstitution\n${detail.substitution}\n\nFinal answer\n${detail.result}`;
    }

    const variables = [...this.content.querySelectorAll('.math-detail')]
      .find((wrapper) => wrapper.querySelector('dt')?.textContent === 'Variables');
    const definition = variables?.querySelector('dd');
    if (definition) {
      const lines = normaliseList(detail.variables).map((variable) => {
        if (typeof variable === 'string') return variable;
        const value = variable.value == null ? '' : `; here ${variable.value}`;
        return `${variable.symbol} = ${variable.definition}${value}`;
      });
      definition.replaceChildren();
      if (lines.length > 1) {
        const list = document.createElement('ul');
        for (const line of lines) appendTextElement(list, 'li', '', line);
        definition.append(list);
      } else {
        definition.textContent = lines[0] || 'No independent variables beyond the entered date.';
      }
    }
  }

  render(detail) {
    this.content.replaceChildren();
    appendTextElement(this.content, 'p', 'math-sheet__kicker', `${detail.classification} calculation`);
    const heading = appendTextElement(this.content, 'h2', '', detail.title);
    heading.id = 'math-sheet-title';

    appendTextElement(
      this.content,
      'pre',
      'math-sheet__formula',
      `Formula\n${detail.formula}\n\nSubstitution\n${detail.substitution}\n\nFinal answer\n${detail.result}`,
    );

    const grid = document.createElement('dl');
    grid.className = 'math-sheet__grid';
    this.content.append(grid);

    const addDetail = (label, values, asList = false) => {
      const items = normaliseList(values).filter(Boolean);
      if (!items.length) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'math-detail';
      appendTextElement(wrapper, 'dt', '', label);
      const dd = document.createElement('dd');
      if (asList && items.length > 1) {
        const list = document.createElement('ul');
        for (const item of items) appendTextElement(list, 'li', '', item);
        dd.append(list);
      } else {
        dd.textContent = items.join(' ');
      }
      wrapper.append(dd);
      grid.append(wrapper);
    };

    const variableLines = normaliseList(detail.variables).map((variable) => {
      if (typeof variable === 'string') return variable;
      const value = variable.value == null ? '' : `; here ${variable.value}`;
      return `${variable.symbol} = ${variable.definition}${value}`;
    });
    addDetail('Variables', variableLines.length ? variableLines : 'No independent variables beyond the entered date.', true);
    addDetail('Units and conversions', normaliseList(detail.conversions).filter(Boolean).length ? detail.conversions : 'Units are stated directly in the formula and final answer.', true);
    addDetail('Assumptions', normaliseList(detail.assumptions).filter(Boolean).length ? detail.assumptions : 'No modelling assumption beyond the entered date and stated calendar convention.', true);
    addDetail('Possible uncertainty', detail.uncertainty || 'None beyond input precision and display rounding.');

    const sources = normaliseList(detail.source).filter(Boolean);
    if (sources.length) {
      const wrapper = document.createElement('div');
      wrapper.className = 'math-detail';
      appendTextElement(wrapper, 'dt', '', 'Data source');
      const dd = document.createElement('dd');
      sources.forEach((source, index) => {
        if (typeof source === 'string') {
          dd.append(document.createTextNode(source));
        } else if (source.url) {
          const link = document.createElement('a');
          link.href = source.url;
          link.target = '_blank';
          link.rel = 'noreferrer';
          link.textContent = source.title || source.url;
          dd.append(link);
        } else {
          dd.append(document.createTextNode(source.title || 'Source recorded in the project data'));
        }
        if (index < sources.length - 1) dd.append(document.createElement('br'));
      });
      wrapper.append(dd);
      grid.append(wrapper);
    }
  }

  open(detail, trigger) {
    if (this.closeTimer) window.clearTimeout(this.closeTimer);
    this.returnFocus = trigger || document.activeElement;
    this.currentId = trigger?.dataset.mathId || null;
    this.render(detail);
    this.root.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      this.root.classList.add('is-open');
      this.panel.focus({ preventScroll: true });
    });
  }

  close() {
    if (this.root.hidden) return;
    this.root.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    this.closeTimer = window.setTimeout(() => {
      this.root.hidden = true;
      this.returnFocus?.focus?.({ preventScroll: true });
      this.returnFocus = null;
      this.currentId = null;
    }, 330);
  }

  onKeyDown(event) {
    if (this.root.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...this.panel.querySelectorAll(FOCUSABLE)].filter((element) => {
      return !element.hidden && element.getAttribute('aria-hidden') !== 'true';
    });
    if (!focusable.length) {
      event.preventDefault();
      this.panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === this.panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
