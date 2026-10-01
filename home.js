(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.atmosphere-hero');
  const canvas = document.querySelector('.grain');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 760px)');
  const touchOnly = matchMedia('(hover: none), (pointer: coarse)');
  const images = [...document.querySelectorAll('.project-image')].map(element => ({element, value: 0}));
  const entrances = new Set();
  const paused = false;
  let heroVisible = true, raf = 0, previousTime = 0;
  let pointerX = 0, pointerY = 0;
  const current = {x: 0, y: 0};
  const staticMode = () => reduced.matches || narrow.matches || touchOnly.matches;
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
    const blend = 1 - Math.exp(-elapsed / 190);
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
      current.x = ease(current.x, pointerX);
      current.y = ease(current.y, pointerY);
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
    pointerX = (clamp((event.clientX - box.left) / box.width, 0, 1) - 0.61) * box.width;
    pointerY = (clamp((event.clientY - box.top) / box.height, 0, 1) - 0.60) * box.height;
    schedule();
  }, {passive: true});
  hero.addEventListener('pointerleave', () => { pointerX = pointerY = 0; schedule(); });
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', () => { paintGrain(); schedule(); }, {passive: true});
  reduced.addEventListener('change', syncMotion);
  narrow.addEventListener('change', syncMotion);
  touchOnly.addEventListener('change', syncMotion);
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
  // One brief stagger; default HTML stays fully visible without motion support.
  if (active()) {
    hero.querySelectorAll('.hero-title-line, .identity-copy').forEach((element, index) => {
      if (typeof element.animate !== 'function') return;
      const animation = element.animate([
        {opacity: 0.72, transform: 'translateY(8px)'},
        {opacity: 1, transform: 'translateY(0)'}
      ], {duration: 750, delay: index * 250, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards'});
      entrances.add(animation);
      animation.onfinish = () => entrances.delete(animation);
    });
  }
  syncMotion();
})();

// Optional controls enhance native horizontal scrolling; vertical scroll stays native.
(() => {
  const rail = document.querySelector('.work-rail');
  if (!rail) return;
  const controls = document.querySelector('.work-rail-controls');
  const buttons = [...controls.querySelectorAll('button')];
  controls.hidden = false;
  const update = () => {
    buttons[0].disabled = rail.scrollLeft <= 2;
    buttons[1].disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
  };
  const move = direction => {
    const step = rail.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap);
    rail.scrollBy({left:direction * step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  };
  buttons.forEach(button => button.addEventListener('click', () => move(Number(button.dataset.railStep))));
  rail.addEventListener('keydown', event => {
    if (event.target !== rail || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();move(event.key === 'ArrowRight' ? 1 : -1);
  });
  rail.addEventListener('scroll',update,{passive:true});
  new ResizeObserver(update).observe(rail);
  update();
})();
