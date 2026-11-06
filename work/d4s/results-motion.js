// One entrance per metric; all final values remain readable without JavaScript.
(() => {
  const metrics = [...document.querySelectorAll('#board-1 .results-number[data-count-target]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (!metrics.length || reduce.matches || !('IntersectionObserver' in window)) return;
  const frames = new Map();
  const finish = element => {
    cancelAnimationFrame(frames.get(element));
    element.querySelector('.results-count').textContent = `${element.dataset.countTarget}%`;
    element.dataset.countPlayed = 'true';
    element.classList.remove('results-motion-ready', 'results-motion-running');
    element.classList.add('results-motion-done');
  };
  const play = (element, index) => {
    element.dataset.countPlayed = 'true';
    const target = Number(element.dataset.countTarget);
    const label = element.querySelector('.results-count');
    const delay = index * 120;
    const duration = 1000;
    const start = performance.now() + delay;
    label.textContent = '0%';
    function frame(now) {
      if (reduce.matches || document.hidden) { finish(element); return; }
      if (now < start) { frames.set(element, requestAnimationFrame(frame)); return; }
      element.classList.add('results-motion-running');
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = t * (1.35 - 0.35 * t);
      const value = t < 1 ? -Math.floor(Math.abs(target) * eased) : target;
      label.textContent = `${value === 0 ? 0 : value}%`;
      if (t < 1) frames.set(element, requestAnimationFrame(frame));
      else {
        label.textContent = `${target}%`;
        element.classList.remove('results-motion-running');
        element.classList.add('results-motion-done');
      }
    }
    frames.set(element, requestAnimationFrame(frame));
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      const element = entry.target;
      observer.unobserve(element);
      if (element.dataset.countPlayed !== 'true') play(element, metrics.indexOf(element));
    }
  }, {threshold: 0.5});
  metrics.forEach(element => { element.classList.add('results-motion-ready'); observer.observe(element); });
  reduce.addEventListener('change', () => { if (reduce.matches) { observer.disconnect(); metrics.forEach(finish); } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) metrics.filter(e => e.dataset.countPlayed === 'true').forEach(finish);
  });
})();
