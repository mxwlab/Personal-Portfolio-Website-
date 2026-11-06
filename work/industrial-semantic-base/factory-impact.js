// A single entrance for the primary result; the source always contains the final 30.
(() => {
  const number = document.querySelector('#v3-factory-impact .impact-thirty');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (!number || reduce.matches || !('IntersectionObserver' in window)) return;

  const finalValue = number.textContent.trim();
  const target = Number(finalValue);
  if (!Number.isFinite(target)) return;
  const space = document.createElement('span');
  space.className = 'impact-thirty-space';
  space.textContent = finalValue;
  const count = document.createElement('span');
  count.className = 'impact-thirty-count';
  count.textContent = finalValue;
  number.replaceChildren(space, count);
  number.classList.add('impact-thirty-ready');

  let frameId = 0;
  let played = false;
  const finish = () => {
    cancelAnimationFrame(frameId);
    number.replaceChildren(finalValue);
    number.classList.remove('impact-thirty-ready');
    number.dataset.countState = 'done';
  };
  const play = () => {
    played = true;
    number.dataset.countState = 'running';
    const start = performance.now();
    count.textContent = '0';
    const frame = now => {
      if (reduce.matches || document.hidden) { finish(); return; }
      const progress = Math.min(1, Math.max(0, (now - start) / 1000));
      const eased = progress * (1.35 - 0.35 * progress);
      count.textContent = String(Math.floor(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(frame);
      else finish();
    };
    frameId = requestAnimationFrame(frame);
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
      observer.unobserve(number);
      if (!played) play();
    }
  }, { threshold: 0.5 });
  observer.observe(number);
  reduce.addEventListener('change', () => {
    if (!reduce.matches) return;
    played = true;
    observer.disconnect();
    finish();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && played) finish();
  });
})();
