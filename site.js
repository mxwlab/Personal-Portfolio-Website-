const tabs = [...document.querySelectorAll('[data-proof]')];
function activateTab(tab, focus = false) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : offset ? (index + offset + tabs.length) % tabs.length : null;
    if (target !== null) { event.preventDefault(); activateTab(tabs[target], true); }
  });
});
const filters = [...document.querySelectorAll('[data-filter]')];
if (filters.length) {
  const cards = [...document.querySelectorAll('.archive-grid [data-category]')];
  function filterWork(category, updateURL = true) {
    const valid = filters.some(b => b.dataset.filter === category) ? category : 'all';
    let count = 0;
    cards.forEach(card => { card.hidden = valid !== 'all' && card.dataset.category !== valid; if (!card.hidden) count++; });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === valid)));
    document.querySelector('.filter-status').textContent = `显示 ${count} 个项目`;
    if (updateURL) {
      const url = new URL(location.href);
      valid === 'all' ? url.searchParams.delete('category') : url.searchParams.set('category', valid);
      history.replaceState(null, '', url);
    }
    return { category: valid, count, projects: cards.filter(card => !card.hidden).map(card => ({ title: card.querySelector('h3').textContent.replace('（新窗口）',''), url: card.querySelector('h3 a').href })) };
  }
  filters.forEach(button => button.addEventListener('click', () => filterWork(button.dataset.filter)));
  filterWork(new URLSearchParams(location.search).get('category') || 'all', false);
  addEventListener('popstate', () => filterWork(new URLSearchParams(location.search).get('category') || 'all', false));
  // Optional browser capability: the same public filter action, no stored or remote state.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const tool = {
      name: 'filter_portfolio_projects', title: '按能力方向查看作品',
      description: '筛选当前作品列表并返回可见项目；只改变本页筛选状态，不修改项目内容。',
      inputSchema: { type: 'object', properties: { category: { type: 'string', enum: filters.map(button => button.dataset.filter) } }, required: ['category'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).length !== 1 || !filters.some(button => button.dataset.filter === input.category)) throw new Error('请选择一个有效的能力方向');
        return filterWork(input.category);
      }
    };
    try { Promise.resolve(document.modelContext.registerTool(tool, {signal:lifecycle.signal})).catch(() => {}); } catch {}
    addEventListener('pagehide', event => { if (!event.persisted) lifecycle.abort(); }, {once:true});
  }
}
const dialog = document.getElementById('image-dialog');
dialog?.setAttribute('aria-label', '作品图片查看器');
let imageTrigger;
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  if (!dialog?.showModal) { window.open(button.dataset.zoom, '_blank', 'noopener'); return; }
  imageTrigger = button;
  dialog.querySelector('img').src = button.dataset.zoom;
  dialog.querySelector('img').alt = button.dataset.alt;
  dialog.querySelector('.dialog-caption').textContent = button.dataset.alt;
  dialog.showModal();
}));
if (dialog) {
  // The image viewer has one control; keep Tab navigation inside the modal.
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Tab') { event.preventDefault(); dialog.querySelector('.dialog-close').focus(); }
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { dialog.querySelector('img').removeAttribute('src'); imageTrigger?.focus(); });
}

// Keep the module identity visible through its evidence and expanded details.
const sceneRail = document.querySelector('.scene-rail');
if (sceneRail) {
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const links = [...sceneRail.querySelectorAll('a')];
  let scheduled = false;
  const updateScene = () => {
    scheduled = false;
    const activationLine = 175 + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
    const active = scenes.filter(scene => scene.getBoundingClientRect().top <= activationLine).at(-1);
    const finished = document.querySelector('#outcome')?.getBoundingClientRect().top <= activationLine;
    links.forEach(link => {
      if (!finished && active && link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScene); } }, {passive:true});
  addEventListener('resize', updateScene);
  updateScene();
}

// Quiet looping demos: pause offscreen; respect reader pause and reduced motion.
document.querySelectorAll('[data-case-video]').forEach(video => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, readerPaused = false, readerStarted = false;
  video.muted = true;
  const toggle = video.parentElement.querySelector('.video-toggle');
  const updateToggle = () => {
    const label = video.paused ? '播放动画' : '暂停动画';
    toggle.textContent = label;
    toggle.setAttribute('aria-label', label);
  };
  toggle.addEventListener('click', () => {
    if (video.paused) { readerStarted = true; readerPaused = false; video.play().catch(() => {}); }
    else { readerPaused = true; readerStarted = false; video.pause(); }
  });
  video.addEventListener('play', updateToggle);
  video.addEventListener('pause', updateToggle);

  const update = () => {
    if (!visible || document.hidden || (motion.matches && !readerStarted)) video.pause();
    else if (!readerPaused) video.play().catch(() => {});
  };
  video.addEventListener('pause', () => {
    if (visible && !document.hidden && !motion.matches) readerPaused = true;
  });
  video.addEventListener('play', () => { readerPaused = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      update();
    }, {threshold:0.25}).observe(video);
  }
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', update);
});
