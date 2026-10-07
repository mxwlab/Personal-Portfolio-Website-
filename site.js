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
  const browse = document.querySelector('[data-project-browse]') || document.querySelector('.archive-section');
  const cards = [...browse.querySelectorAll('.project-card[data-category]')];
  const groups = [...browse.querySelectorAll('[data-project-group]')];
  const design = document.querySelector('[data-design-works]');
  const archiveGrid = document.querySelector('.archive-section > .archive-grid');
  const filteredGrid = browse.querySelector('[data-filtered-projects]');
  // Move the existing homepage cards; placeholders preserve the original two groups.
  const homePositions = filteredGrid ? new Map(cards.map(card => {
    const position = document.createComment('project position');
    card.before(position);
    return [card, position];
  })) : null;
  const homeOrder = filteredGrid?.dataset.projectOrder.split(' ');
  const orderedHomeCards = filteredGrid ? [...cards].sort((a, b) =>
    homeOrder.indexOf(a.querySelector('.project-image-link').getAttribute('href')) -
    homeOrder.indexOf(b.querySelector('.project-image-link').getAttribute('href'))) : [];
  function filterWork(category, updateURL = true) {
    const mapped = ['ai-companion', 'experimental-hardware'].includes(category) ? 'ai-product' : category;
    const valid = filters.some(b => b.dataset.filter === mapped) ? mapped : 'all';
    let count = 0;
    cards.forEach(card => { const group = ['ai-companion', 'experimental-hardware'].includes(card.dataset.category) ? 'ai-product' : card.dataset.category; card.hidden = valid !== 'all' && group !== valid; if (!card.hidden) count++; });
    if (filteredGrid) {
      if (valid === 'all') for (const [card, position] of homePositions) position.after(card);
      else filteredGrid.append(...orderedHomeCards);
      filteredGrid.hidden = valid === 'all' || valid === 'design';
    }
    if (archiveGrid) archiveGrid.hidden = valid === 'design';
    for (const group of groups) group.hidden = ![...group.querySelectorAll('.project-card')].some(card=>!card.hidden);
    if (design) design.hidden = !['all', 'design'].includes(valid);
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === valid)));
    document.querySelector('.filter-status').textContent = `显示 ${count} 个项目${design && !design.hidden ? '与 2 组设计作品' : ''}`;
    if (updateURL) {
      const url = new URL(location.href);
      valid === 'all' ? url.searchParams.delete('category') : url.searchParams.set('category', valid);
      if (valid !== 'design' && url.hash === '#design-works') url.hash = '';
      history.replaceState(null, '', url);
    }
    document.dispatchEvent(new Event('portfoliofilterchange'));
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

// Single cover preview: load only on visibility, keep the poster for reduced motion or blocked autoplay.
(() => {
  const media = document.querySelector('.craft-preview-video');
  if (!media || !('IntersectionObserver' in window)) return;
  const dialog = document.getElementById('craft-dialog');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, pageActive = true, blocked = false;
  const allowed = () => visible && pageActive && !document.hidden && !motion.matches && !dialog.open && !blocked;
  const pause = () => { media.pause(); media.classList.remove('is-playing'); };
  const sync = () => {
    if (!allowed()) { pause(); return; }
    if (!media.getAttribute('src')) media.src = media.dataset.src;
    media.muted = true; media.playsInline = true; media.loop = true;
    const playing = media.play();
    if (playing) playing.then(() => { if (!allowed()) pause(); }).catch(error => {
      if (error.name !== 'AbortError') blocked = true;
      pause();
    });
  };
  media.addEventListener('playing', () => { if (allowed()) media.classList.add('is-playing'); else pause(); });
  media.addEventListener('error', () => { blocked = true; pause(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
    sync();
  }, {threshold:[0, .15]}).observe(media.parentElement);
  new MutationObserver(sync).observe(dialog, {attributes:true, attributeFilter:['open']});
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { pageActive = false; pause(); });
  window.addEventListener('pageshow', () => { pageActive = true; sync(); });
})();

// Design-work media viewer: motion playback and original screen documents grouped by platform.
(() => {
  const viewer = document.getElementById('craft-dialog');
  if (!viewer) return;
  const groups = viewer.querySelector('.craft-groups');
  const stage = viewer.querySelector('.craft-stage');
  const current = viewer.querySelector('.craft-current');
  const context = viewer.querySelector('.craft-context');
  const close = viewer.querySelector('.craft-close');
  const screenToolbar = viewer.querySelector('.screen-toolbar');
  const platformButtons = viewer.querySelector('.screen-platforms');
  const screenClose = viewer.querySelector('.screen-close');
  const steps = [...viewer.querySelectorAll('[data-craft-step]')];
  let kind = 'spatial', group = 0, item = 0, trigger, scrollX = 0, scrollY = 0, bodyStyle;
  const screenGroups = JSON.parse(document.getElementById('screen-media-data')?.textContent || '[]');
  const works = JSON.parse(document.getElementById('craft-media-data').textContent);
  const illustrations = JSON.parse(document.getElementById('illustration-media-data')?.textContent || '[]');
  const collection = () => kind === 'illustrations' ? illustrations : works;
  const pauseMedia = () => viewer.querySelectorAll('video').forEach(video => video.pause());
  function render() {
    pauseMedia();
    const screens = kind === 'screens';
    const pictures = kind === 'illustrations';
    const count = screens ? screenGroups[group].pages.length : collection().length;
    viewer.querySelector('#craft-viewer-title').textContent = screens ? screenGroups[group].title : pictures ? '插画创作' : '三维与动态设计';
    groups.hidden = true;
    viewer.querySelector('.craft-viewer-header').hidden = screens;
    screenToolbar.hidden = !screens;
    stage.tabIndex = screens ? 0 : -1;
    platformButtons.querySelectorAll('button').forEach((button, index) => button.setAttribute('aria-pressed', String(index === group)));
    context.hidden = true;
    viewer.querySelector('.craft-viewer-footer').hidden = screens;
    steps.forEach(button => { button.hidden = screens; });
    viewer.classList.toggle('screens-mode', screens);
    stage.classList.toggle('screens-strip', screens);
    groups.querySelectorAll('button').forEach((button, index) => button.setAttribute('aria-pressed', String(index === group)));
    current.textContent = screens ? `${screenGroups[group].title} · ${count} 张` : pictures ? `插画 ${item + 1} / ${count}` : `${works[item].title} · ${item + 1} / ${count}`;
    stage.replaceChildren();
    if (pictures) {
      const picture = illustrations[item];
      const media = document.createElement('img');
      media.className = 'craft-real-media craft-illustration-media';
      media.alt = picture.alt; media.width = picture.width; media.height = picture.height;
      media.src = picture.src;
      const error = document.createElement('p'); error.hidden = true;
      error.textContent = '图片暂未加载成功，请切换后重试。';
      media.addEventListener('error', () => { error.hidden = false; });
      stage.append(media, error);
    } else if (!screens) {
      const work = works[item];
      const media = document.createElement('video');
      media.className = 'craft-real-media';
      media.controls = true; media.playsInline = true; media.muted = true; media.autoplay = true;
      media.preload = 'metadata'; media.poster = work.poster; media.src = work.video; media.tabIndex = 0;
      media.setAttribute('aria-label',work.title+'完整视频');
      const detail = document.createElement('p');
      detail.textContent = `${work.duration} 秒 · 无声视频`;
      const fallback = document.createElement('button');
      fallback.type = 'button'; fallback.hidden = true; fallback.textContent = '点击播放';
      const attemptPlay = async () => {
        try { await media.play(); }
        catch {
          if (viewer.open && stage.contains(media)) { fallback.hidden = false; detail.textContent = '未能自动播放，请点击播放或使用视频控件。'; }
        }
      };
      fallback.addEventListener('click', attemptPlay);
      media.addEventListener('playing', () => { fallback.hidden = true; detail.textContent = `${work.duration} 秒 · 无声视频`; });
      media.addEventListener('error', () => { if (viewer.open && stage.contains(media)) { fallback.hidden = false; detail.textContent = '视频暂未加载成功，可点击重试。'; } });
      stage.append(media,detail,fallback);
      attemptPlay();
    } else {
      screenGroups.forEach((platform, platformIndex) => {
        const section = document.createElement('section');
        section.id = `screen-platform-${platformIndex}`;
        section.className = 'screen-platform-section';
        section.setAttribute('aria-label', platform.title);
        platform.pages.forEach((page, index) => {
          const figure = document.createElement('figure');
          const media = document.createElement('img');
          media.src = page.src; media.alt = `${platform.title} · ${page.name}`;
          media.width = page.width; media.height = page.height;
          media.loading = platformIndex === 0 && index === 0 ? 'eager' : 'lazy'; media.decoding = 'async';
          const error = document.createElement('p'); error.hidden = true;
          error.textContent = `${page.name} 暂未加载成功，请重新打开浏览器。`;
          media.addEventListener('error', () => { error.hidden = false; });
          figure.append(media, error); section.append(figure);
        });
        stage.append(section);
      });
      updateScreenActive();
    }
    stage.scrollTop = 0; stage.scrollLeft = 0;
    steps[0].disabled = item === 0;
    steps[1].disabled = item === count - 1;
    if (document.activeElement?.disabled) steps.find(button => !button.disabled)?.focus({preventScroll:true});
  }
  const screenOffset = () => screenToolbar.getBoundingClientRect().height + 12;
  function updateScreenActive() {
    if (kind !== 'screens' || !viewer.open) return;
    const sections = [...stage.querySelectorAll('.screen-platform-section')];
    const line = stage.getBoundingClientRect().top + screenOffset() + 4;
    const active = sections.filter(section => section.getBoundingClientRect().top <= line).at(-1) || sections[0];
    group = Math.max(0, sections.indexOf(active));
    platformButtons.querySelectorAll('button').forEach((button,index) => {
      button.setAttribute('aria-pressed', String(index === group));
      if (index === group) {
        button.setAttribute('aria-current','location');
        const b=button.getBoundingClientRect(), rail=platformButtons.getBoundingClientRect();
        if(b.left<rail.left || b.right>rail.right) platformButtons.scrollLeft += b.left-rail.left;
      } else button.removeAttribute('aria-current');
    });
  }
  let screenScrollScheduled = false;
  stage.addEventListener('scroll', () => {
    if (screenScrollScheduled || kind !== 'screens') return;
    screenScrollScheduled = true;
    requestAnimationFrame(() => { screenScrollScheduled = false; updateScreenActive(); });
  },{passive:true});
  window.addEventListener('resize', updateScreenActive);
  screenGroups.forEach((platform, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = platform.title;
    button.setAttribute('aria-pressed', String(index === group));
    button.setAttribute('aria-controls', `screen-platform-${index}`);
    button.addEventListener('click', () => {
      if (kind !== 'screens') return;
      const target = stage.querySelector(`#screen-platform-${index}`);
      if (!target) return;
      stage.scrollTo({top:stage.scrollTop + target.getBoundingClientRect().top - stage.getBoundingClientRect().top - screenOffset(),behavior:'instant'});
      updateScreenActive();
    });
    platformButtons.append(button);
  });
  screenClose.addEventListener('click', () => viewer.close());
  viewer.addEventListener('pointerdown', () => viewer.classList.remove('screen-keyboard'));
  viewer.addEventListener('keydown', event => { if (event.key === 'Tab') viewer.classList.add('screen-keyboard'); });
  document.querySelectorAll('[data-craft-open]').forEach(button => button.addEventListener('click', () => {
    viewer.classList.remove('screen-keyboard');
    trigger = button; kind = button.dataset.craftOpen; group = 0; item = 0;
    scrollX = window.scrollX; scrollY = window.scrollY; bodyStyle = document.body.getAttribute('style');
    viewer.showModal();
    render();
    Object.assign(document.body.style, {position:'fixed', top:`-${scrollY}px`, left:`-${scrollX}px`, width:'100%', overflow:'hidden'});
    (kind === 'screens' ? screenClose : close).focus({preventScroll:true});
  }));
  // Direct preview link reuses the existing viewer and close/focus behavior.
  if (location.hash === '#visualization') document.querySelector('[data-craft-open="screens"]')?.click();
  steps.forEach(button => button.addEventListener('click', () => {
    if (kind === 'screens') return;
    item = Math.max(0, Math.min(collection().length - 1, item + Number(button.dataset.craftStep)));
    render();
  }));
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('cancel', event => { event.preventDefault(); viewer.close(); });
  viewer.addEventListener('keydown', event => {
    if (kind === 'illustrations' && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      item = Math.max(0, Math.min(illustrations.length - 1, item + (event.key === 'ArrowRight' ? 1 : -1)));
      render(); return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...viewer.querySelectorAll('button, select, video[controls], [tabindex="0"]')].filter(button => !button.disabled && !button.closest('[hidden]'));
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  viewer.addEventListener('close', () => {
    pauseMedia();
    stage.replaceChildren();
    if (bodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', bodyStyle);
    window.scrollTo({left:scrollX, top:scrollY, behavior:'instant'});
    trigger?.focus({preventScroll:true});
  });
})();

// About photo wall: a separate, non-interactive preview never changes card geometry.
(() => {
  const wall = document.querySelector(':is(.about-page,.home-page) .creative-wall');
  if (!wall) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const preview = document.createElement('div');
  preview.className = 'about-photo-hover-preview';
  preview.hidden = true;
  preview.setAttribute('aria-hidden', 'true');
  const enlarged = document.createElement('img');
  enlarged.alt = '';
  preview.append(enlarged);
  document.body.append(preview);
  let timer, generation = 0;
  const hide = () => { clearTimeout(timer); generation++; preview.hidden = true; };
  wall.querySelectorAll('.creative-postcard .media img').forEach(source => {
    source.addEventListener('pointerenter', event => {
      hide();
      if (!fine.matches || event.pointerType === 'touch') return;
      const token = generation;
      timer = setTimeout(async () => {
        enlarged.src = source.srcset ? source.srcset.split(',').at(-1).trim().split(/\s+/)[0] : source.src;
        try { await enlarged.decode(); } catch { return; }
        if (token !== generation || !fine.matches) return;
        const r = source.closest('.creative-postcard').getBoundingClientRect();
        const pad = 16, gap = 20;
        const topLimit = Math.max(pad, (document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0) + pad);
        const rightSpace = innerWidth - r.right - gap - pad;
        const leftSpace = r.left - gap - pad;
        const right = rightSpace >= leftSpace;
        const availableWidth = Math.min(560, right ? rightSpace : leftSpace);
        const availableHeight = Math.min(640, innerHeight - topLimit - pad);
        const ratio = enlarged.naturalWidth / enlarged.naturalHeight;
        const width = Math.min(availableWidth, availableHeight * ratio);
        const height = width / ratio;
        if (width < 200 || height < 150) return;
        preview.style.width = `${width}px`;
        preview.style.height = `${height}px`;
        preview.style.left = `${right ? r.right + gap : r.left - gap - width}px`;
        preview.style.top = `${Math.max(topLimit, Math.min(r.top + (r.height - height) / 2, innerHeight - pad - height))}px`;
        preview.hidden = false;
      }, 180);
    });
    source.addEventListener('pointerleave', hide);
    source.addEventListener('pointerdown', hide);
  });
  addEventListener('scroll', hide, { passive: true, capture: true });
  addEventListener('resize', hide);
  addEventListener('blur', hide);
  document.addEventListener('keydown', hide);
  fine.addEventListener('change', hide);
})();

// Retain native video controls, hiding their fullscreen chrome only while playback is idle.
(() => {
  let timer, current = null, dragging = false, keyboard = false;
  const videoInFullscreen = () => {
    const full = document.fullscreenElement;
    return full?.matches('video[controls]') ? full : full?.querySelector('video[controls]');
  };
  const reveal = () => {
    clearTimeout(timer);
    current?.classList.remove('native-controls-idle');
    current = videoInFullscreen();
    if (current && !current.paused && !current.ended && !dragging && !keyboard) {
      timer = setTimeout(() => {
        if (current === videoInFullscreen() && !current.paused && !dragging && !keyboard) current.classList.add('native-controls-idle');
      }, 2500);
    }
  };
  document.addEventListener('fullscreenchange', () => { keyboard = false; dragging = false; reveal(); });
  document.addEventListener('pointermove', () => { if (videoInFullscreen()) { keyboard = false; reveal(); } }, { passive: true });
  document.addEventListener('pointerdown', () => { if (videoInFullscreen()) { dragging = true; keyboard = false; reveal(); } }, true);
  document.addEventListener('pointerup', () => { dragging = false; if (videoInFullscreen()) reveal(); }, true);
  document.addEventListener('pointercancel', () => { dragging = false; reveal(); }, true);
  document.addEventListener('keydown', event => { if (videoInFullscreen()) { keyboard = true; reveal(); if (event.key === 'Escape') { if (current?.closest('#craft-dialog')) { event.preventDefault(); event.stopPropagation(); } document.exitFullscreen().catch(() => {}); } } }, true);
  for (const event of ['play', 'pause', 'ended', 'seeking', 'seeked', 'volumechange']) {
    document.addEventListener(event, e => { if (e.target === videoInFullscreen()) reveal(); }, true);
  }
  window.addEventListener('blur', () => { clearTimeout(timer); current?.classList.remove('native-controls-idle'); });
  window.addEventListener('focus', reveal);
})();
