export function createRevealObserver(onVisible) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    return {
      observe(root = document) {
        root.querySelectorAll('.reveal, .stat').forEach((element) => {
          element.classList.add('is-visible');
          onVisible?.(element);
        });
      },
      disconnect() {},
    };
  }

  const seen = new WeakSet();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      if (!seen.has(entry.target)) {
        seen.add(entry.target);
        onVisible?.(entry.target);
      }
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  return {
    observe(root = document) {
      root.querySelectorAll('.reveal:not(.is-visible), .stat:not(.is-visible)').forEach((element) => observer.observe(element));
    },
    disconnect() { observer.disconnect(); },
  };
}

export function animateNumber(element, target, formatter, duration = 900) {
  if (!Number.isFinite(target)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = formatter(target);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - progress) ** 3;
    element.textContent = formatter(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function setText(elementOrSelector, text) {
  const element = typeof elementOrSelector === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector;
  if (element) element.textContent = text;
}
