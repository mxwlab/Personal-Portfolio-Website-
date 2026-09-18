(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.atmosphere-hero');
  const canvas = document.querySelector('.grain');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 760px)');
  const images = [...document.querySelectorAll('.project-image')].map(element => ({element, value: 0}));
  const entrances = new Set();
  const paused = false;
  let heroVisible = true, raf = 0, previousTime = 0;
  let pointerX = 0, pointerY = 0;
  const current = {x: 0, y: 0, copy: 0, field: 0};
  const staticMode = () => reduced.matches || narrow.matches;
  const active = () => !paused && !staticMode() && !document.hidden;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  // Grain is a small static tile. Never redraw noise at animation frame rate.
  function paintGrain() {
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const tile = document.createElement('canvas');
    tile.width = tile.height = 144;
    const brush = tile.getContext('2d');
    if (!brush) return;
    const pixels = brush.createImageData(144, 144);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const value = Math.floor(Math.random() * 256);
      pixels.data.set([value, value, value, 255], i);
    }
    brush.putImageData(pixels, 0, 0);
    canvas.width = Math.ceil(hero.clientWidth);
    canvas.height = Math.ceil(hero.clientHeight);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function writeHero() {
    root.style.setProperty('--pointer-x', `${current.x.toFixed(2)}px`);
    root.style.setProperty('--pointer-y', `${current.y.toFixed(2)}px`);
    root.style.setProperty('--copy-shift', `${current.copy.toFixed(2)}px`);
    root.style.setProperty('--field-shift', `${current.field.toFixed(2)}px`);
  }
  function resetPositions() {
    for (const key of Object.keys(current)) current[key] = 0;
    pointerX = pointerY = 0;
    writeHero();
    for (const image of images) {
      image.value = 0;
      image.element.style.setProperty('--image-shift', '0px');
    }
  }
  function stopFrame() {
    if (raf) cancelAnimationFrame(raf);
    raf = previousTime = 0;
  }
  function schedule() {
    if (active() && !raf) raf = requestAnimationFrame(frame);
  }
  function frame(time) {
    raf = 0;
    if (!active()) { previousTime = 0; return; }
    // Time-based easing stays consistent on 60/120 Hz displays. No endless JS loop at rest.
    const elapsed = previousTime ? clamp(time - previousTime, 1, 48) : 16.7;
    previousTime = time;
    const blend = 1 - Math.exp(-elapsed / 145);
    let unsettled = false;
    function ease(from, to) {
      const delta = to - from;
      if (Math.abs(delta) < 0.06) return to;
      unsettled = true;
      return from + delta * blend;
    }
    // Read all layout before writing styles.
    const heroBox = hero.getBoundingClientRect();
    const visibleImages = images.map(image => ({image, box: image.element.getBoundingClientRect()}))
      .filter(({box}) => box.bottom > 0 && box.top < innerHeight);
    if (heroBox.bottom > 0 && heroBox.top < innerHeight) {
      const distance = clamp(-heroBox.top, 0, heroBox.height);
      current.x = ease(current.x, pointerX);
      current.y = ease(current.y, pointerY);
      current.copy = ease(current.copy, Math.min(42, distance * 0.07));
      current.field = ease(current.field, Math.min(105, distance * 0.18));
      writeHero();
    }
    for (const {image, box} of visibleImages) {
      const target = clamp((innerHeight / 2 - box.top - box.height / 2) * 0.035, -10, 10);
      image.value = ease(image.value, target);
      image.element.style.setProperty('--image-shift', `${image.value.toFixed(2)}px`);
    }
    if (unsettled) schedule();
    else previousTime = 0;
  }

  function syncMotion() {
    const isStatic = staticMode();
    root.classList.toggle('motion-paused', paused || isStatic);
    root.classList.toggle('motion-static', isStatic);
    root.classList.toggle('hero-idle', !heroVisible || document.hidden);
    stopFrame();
    if (isStatic) resetPositions();
    for (const animation of entrances) {
      if (isStatic) { animation.cancel(); entrances.delete(animation); }
      else if (active()) animation.play();
      else animation.pause();
    }
    schedule();
  }

  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !active()) return;
    const box = hero.getBoundingClientRect();
    pointerX = (clamp((event.clientX - box.left) / box.width, 0, 1) - 0.5) * 28;
    pointerY = (clamp((event.clientY - box.top) / box.height, 0, 1) - 0.5) * 18;
    schedule();
  }, {passive: true});
  hero.addEventListener('pointerleave', () => { pointerX = pointerY = 0; schedule(); });
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', () => { paintGrain(); schedule(); }, {passive: true});
  reduced.addEventListener('change', syncMotion);
  narrow.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  addEventListener('pagehide', stopFrame);
  addEventListener('pageshow', syncMotion);

  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncMotion();
    });
    heroObserver.observe(hero);
    // Content stays visible in HTML/CSS, even without JS or animation support.
    const entranceObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entranceObserver.unobserve(entry.target);
        if (!active() || typeof entry.target.animate !== 'function') continue;
        const animation = entry.target.animate([
          {opacity: 0.68, transform: 'translateY(12px)'},
          {opacity: 1, transform: 'translateY(0)'}
        ], {duration: 720, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'none'});
        entrances.add(animation);
        animation.onfinish = () => entrances.delete(animation);
      }
    }, {threshold: 0.12, rootMargin: '0px 0px -24px 0px'});
    document.querySelectorAll('.capabilities .section-heading, .selected-work .section-heading, .project-info, .about-strip, .contact-section')
      .forEach(element => entranceObserver.observe(element));
    // Keyboard navigation must not land on partially animated content.
    document.addEventListener('focusin', () => {
      for (const animation of entrances) animation.cancel();
      entrances.clear();
    });
  }

  try { paintGrain(); } catch { /* Keep the static gradient if canvas is unavailable. */ }
  root.classList.add('motion-ready');
  syncMotion();
})();
