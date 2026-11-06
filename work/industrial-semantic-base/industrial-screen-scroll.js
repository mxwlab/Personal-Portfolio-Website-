// Testable navigation decisions; the DOM adapter below is industrial-page only.
export function wheelAction(panels, y, delta) {
  if (!panels.length || !delta) return { type: 'natural' };
  let index = 0;
  for (let i = 1; i < panels.length; i++) {
    if (panels[i].start <= y + 2) index = i;
    else break;
  }
  const panel = panels[index], previous = panels[index - 1], next = panels[index + 1];
  if (delta > 0) {
    if (panel.mode === 'long' && y < panel.tail - 2) {
      return y + delta >= panel.tail ? { type: 'dock', target: panel.tail } : { type: 'natural' };
    }
    return next ? { type: 'page', target: next.start } : { type: 'natural' };
  }
  if (y > panel.start + 2) {
    if (panel.mode === 'screen' || y + delta <= panel.start) return { type: 'dock', target: panel.start };
    return { type: 'natural' };
  }
  return previous ? { type: 'page', target: previous.mode === 'long' ? previous.tail : previous.start } : { type: 'natural' };
}

export function gestureContinues(gesture, now, direction) {
  return now - gesture.lastAt < 220 &&
    (direction === gesture.direction || now - gesture.lastAt < 60);
}

if (typeof window !== 'undefined' && document.body?.matches('.iv3-preview')) {
  const story = document.querySelector('.iv3-story');
  const nodes = [...(story?.querySelectorAll('.iv3-board') || [])]
    .filter(node => !node.parentElement.closest('.iv3-board'));
  if (nodes.length) setupIndustrialReading(story, nodes);
}

function setupIndustrialReading(story, nodes) {
  const body = document.body;
  const nav = document.querySelector('.project-return-nav');
  const rail = document.querySelector('.iv3-rail');
  const menu = document.querySelector('.iv3-menu-toggle');
  const firstChapter = nodes.findIndex(node => node.hasAttribute('data-v3-chapter'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let panels = [], measureFrame = 0, animationFrame = 0, animating = false;
  let lastInput = '', lastDirection = 0, settleTimer = 0, suspendedUntil = 0;
  let gesture = { lastAt: -Infinity, direction: 0, consumed: false, distance: 0 };
  let touch = null;
  let initialHash = location.hash;

  body.classList.add('industrial-reading-enabled');

  function topInset(index) {
    if (index === 0) return 0;
    const header = nav?.getBoundingClientRect().height || 54;
    if (index < firstChapter) return header;
    const contents = innerWidth >= 1440 ? 0 : innerWidth <= 720
      ? menu?.getBoundingClientRect().height || 48
      : rail?.getBoundingClientRect().height || 55;
    return header + contents + 16;
  }

  function measure() {
    measureFrame = 0;
    const visible = nodes.filter(node => node.getClientRects().length);
    visible.forEach((node, i) => {
      delete node.dataset.screenMode;
      node.style.removeProperty('--industrial-screen-min-height');
      node.style.setProperty('--industrial-screen-offset', `${topInset(i)}px`);
    });
    const tops = visible.map(node => node.getBoundingClientRect().top + scrollY);
    const storyEnd = Math.max(...visible.map(node => node.getBoundingClientRect().bottom + scrollY),
      ...[...story.querySelectorAll('.iv3-result-copy')].map(node => node.getBoundingClientRect().bottom + scrollY));
    visible.forEach((node, i) => {
      const end = tops[i + 1] ?? storyEnd;
      const frame = innerHeight - topInset(i);
      // The span includes any standalone explanation after the board itself.
      const extra = Math.max(0, end - tops[i] - node.getBoundingClientRect().height);
      const mode = end - tops[i] <= frame + 2 ? 'screen' : 'long';
      node.dataset.screenMode = mode;
      if (mode === 'screen') node.style.setProperty('--industrial-screen-min-height', `${Math.max(0, frame - extra)}px`);
    });
    const positions = visible.map(node => node.getBoundingClientRect().top + scrollY);
    const end = Math.max(...visible.map(node => node.getBoundingClientRect().bottom + scrollY),
      ...[...story.querySelectorAll('.iv3-result-copy')].map(node => node.getBoundingClientRect().bottom + scrollY));
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    panels = visible.map((node, i) => {
      const start = Math.min(maxScroll, Math.max(0, positions[i] - topInset(i)));
      const bottom = positions[i + 1] ?? end;
      return { node, start, tail: Math.max(start, Math.min(maxScroll, bottom - innerHeight)), mode: node.dataset.screenMode };
    });
    if (initialHash) {
      const target = document.getElementById(initialHash.slice(1));
      const panel = panels.find(item => item.node === target || item.node.contains(target));
      if (panel && target) {
        const inset = panel.node.getBoundingClientRect().top + scrollY - panel.start;
        scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + scrollY - inset), behavior: 'instant' });
      }
    }
  }

  function scheduleMeasure() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  }

  function cancelAnimation() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    animating = false;
    clearTimeout(settleTimer);
  }

  function moveTo(target, gentle = false) {
    cancelAnimation();
    const from = scrollY, distance = target - from;
    if (reducedMotion.matches || Math.abs(distance) < 1) {
      scrollTo({ top: target, behavior: 'instant' });
      return;
    }
    animating = true;
    const began = performance.now();
    const duration = gentle ? 240 : 520;
    const tick = now => {
      const progress = Math.min(1, (now - began) / duration);
      const eased = 1 - (1 - progress) ** 3;
      scrollTo({ top: from + distance * eased, behavior: 'instant' });
      if (progress < 1) animationFrame = requestAnimationFrame(tick);
      else { animating = false; animationFrame = 0; }
    };
    animationFrame = requestAnimationFrame(tick);
  }

  function blocked(target, delta) {
    if (document.querySelector('dialog[open]') || document.fullscreenElement) return true;
    const element = target instanceof Element ? target : target?.parentElement;
    if (element?.closest('video, input, textarea, select, [contenteditable="true"], .iv3-rail')) return true;
    for (let node = element; node && node !== body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2) {
        if (delta > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 1) return true;
      }
    }
    return false;
  }

  function onWheel(event) {
    initialHash = '';
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const delta = event.deltaY * multiplier;
    if (!delta || event.defaultPrevented || event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)
      || performance.now() < suspendedUntil || blocked(event.target, delta)) {
      lastInput = '';
      return;
    }
    const now = performance.now(), direction = Math.sign(delta);
    const continues = gestureContinues(gesture, now, direction);
    if (!continues && animating && direction !== gesture.direction) cancelAnimation();
    if (!continues) gesture = { lastAt: now, direction, consumed: false, distance: 0 };
    gesture.lastAt = now;
    gesture.direction = direction;
    gesture.distance += Math.abs(delta);
    lastInput = 'wheel';
    lastDirection = direction;
    clearTimeout(settleTimer);
    if (animating || gesture.consumed) {
      event.preventDefault();
      return;
    }
    const action = wheelAction(panels, scrollY, delta);
    if (action.type === 'natural') return;
    event.preventDefault();
    if (gesture.distance < 6) return;
    gesture.consumed = true;
    moveTo(action.target, action.type === 'dock');
  }

  function settle() {
    if (animating || !lastInput || performance.now() < suspendedUntil || document.querySelector('dialog[open]')) return;
    // Dock the final reading position, never skip the last viewport of a long block.
    const action = wheelAction(panels, scrollY, lastDirection * 64);
    if (action.type === 'dock' && Math.abs(action.target - scrollY) < 64) {
      gesture.consumed = true;
      moveTo(action.target, true);
    }
  }

  function onScroll() {
    if (animating || !lastInput) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  }

  function yieldToNative() {
    initialHash = '';
    cancelAnimation();
    lastInput = '';
    suspendedUntil = performance.now() + 700;
    gesture = { lastAt: -Infinity, direction: 0, consumed: false, distance: 0 };
  }

  addEventListener('wheel', onWheel, { passive: false });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { yieldToNative(); scheduleMeasure(); });
  addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) yieldToNative();
  });
  addEventListener('pointerdown', yieldToNative, { passive: true });
  addEventListener('click', event => {
    if (event.target.closest?.('a[href*="#"]')) yieldToNative();
  }, { capture: true });
  addEventListener('hashchange', yieldToNative);
  addEventListener('touchstart', event => {
    yieldToNative();
    if (event.touches.length !== 1 || blocked(event.target, 1)) { touch = null; return; }
    const p = event.touches[0];
    touch = { x: p.clientX, y: p.clientY, start: scrollY, fired: false,
      panel: panels.filter(panel => panel.start <= scrollY + 2).at(-1) };
  }, { passive: true });
  addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1) return;
    const delta = touch.y - event.touches[0].clientY;
    if (Math.abs(delta) <= Math.abs(touch.x - event.touches[0].clientX)) return;
    if (touch.panel?.mode === 'screen') {
      const action = wheelAction(panels, touch.start, delta);
      if (action.type === 'natural' && !touch.fired) { lastInput = ''; return; }
      event.preventDefault();
      if (!touch.fired && Math.abs(delta) > 24) {
        if (action.type !== 'natural') moveTo(action.target, false);
        touch.fired = true;
      }
    } else { lastInput = 'touch'; lastDirection = Math.sign(delta); suspendedUntil = 0; }
  }, { passive: false });
  addEventListener('touchend', () => { touch = null; if (lastInput === 'touch') settleTimer = setTimeout(settle, 180); }, { passive: true });
  addEventListener('touchcancel', () => { touch = null; yieldToNative(); }, { passive: true });
  document.addEventListener('load', event => {
    if (event.target.matches?.('img, video')) scheduleMeasure();
  }, { capture: true });
  const observer = new ResizeObserver(scheduleMeasure);
  nodes.forEach(node => observer.observe(node));
  document.fonts?.ready.then(scheduleMeasure);
  addEventListener('pageshow', scheduleMeasure);
  measure();
}
