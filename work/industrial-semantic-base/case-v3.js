// Independent anchors and touch behavior; other project pages do not load this file.
(() => {
  const rail = document.querySelector('.iv3-rail');
  const chapters = [...document.querySelectorAll('[data-v3-chapter]')];
  if (!rail || !chapters.length) return;
  const links = [...rail.querySelectorAll('a')];
  const side = () => matchMedia('(min-width:1440px)').matches;
  const offset = () => (document.querySelector('.site-header')?.getBoundingClientRect().height || 60) + (side() ? 0 : rail.getBoundingClientRect().height || 54) + 16;
  let scheduled = false, activeId = '';
  function update() {
    scheduled = false;
    const readingOffset=offset();
    document.body.style.setProperty('--iv3-reading-offset',`${readingOffset}px`);
    const started = chapters[0].getBoundingClientRect().top <= readingOffset + 5;
    rail.hidden = !started;
    const atEnd=scrollY+innerHeight>=document.documentElement.scrollHeight-4;
    const active = atEnd ? chapters.at(-1) : chapters.filter(chapter => chapter.getBoundingClientRect().top <= readingOffset + 8).at(-1) || chapters[0];
    for (const link of links) {
      if (started && link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    if(started&&!side()&&activeId!==active.id){
      const link=links.find(link=>link.hash==='#'+active.id);
      if(link)rail.scrollTo({left:link.offsetLeft-(rail.clientWidth-link.offsetWidth)/2,behavior:'instant'});
    }
    activeId=started?active.id:'';
    const line = rail.getBoundingClientRect().top + 80;
    rail.classList.toggle('is-dark', [...document.querySelectorAll('.iv3-dark, .iv3-band.dark')].some(board => {
      const rect = board.getBoundingClientRect();
      return rect.top <= line && rect.bottom >= line;
    }));
  }
  function locate(hash) {
    const target = chapters.find(chapter => '#' + chapter.id === hash);
    if (!target) return;
    scrollTo({top: target.getBoundingClientRect().top + scrollY - offset(), behavior: 'instant'});
    update();
  }
  for (const link of links) link.addEventListener('click', event => {
    event.preventDefault();
    history.replaceState(null, '', link.hash);
    locate(link.hash);
  });
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, {passive: true});
  addEventListener('resize', update);
  addEventListener('hashchange', () => locate(location.hash));
  document.fonts.ready.then(() => { if (location.hash) locate(location.hash); update(); });
  update();
})();

// Full-size evidence remains readable on touch screens, with explicit fit/zoom and close controls.
(() => {
  const dialog=document.querySelector('#image-dialog');
  const img=dialog?.querySelector('img');
  if(!dialog||!img)return;
  const area=document.createElement('div');area.className='iv3-dialog-image-area';
  img.before(area);area.append(img);
  const zoom=document.createElement('button');zoom.type='button';zoom.className='iv3-dialog-zoom';
  zoom.textContent='原图尺寸';zoom.setAttribute('aria-pressed','false');
  dialog.querySelector('.dialog-close').after(zoom);
  const reset=()=>{dialog.classList.remove('is-detail-zoomed');zoom.textContent='原图尺寸';zoom.setAttribute('aria-pressed','false');area.scrollTo(0,0);};
  zoom.addEventListener('click',()=>{
    const enabled=!dialog.classList.contains('is-detail-zoomed');
    dialog.style.setProperty('--iv3-original-width',`${img.naturalWidth}px`);
    dialog.classList.toggle('is-detail-zoomed',enabled);
    zoom.textContent=enabled?'适合屏幕':'原图尺寸';zoom.setAttribute('aria-pressed',String(enabled));
    area.scrollTo(0,0);
  });
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    event.preventDefault();event.stopImmediatePropagation();
    const controls=[dialog.querySelector('.dialog-close'),zoom];
    const index=controls.indexOf(document.activeElement);
    controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();
  },true);
  dialog.addEventListener('close',reset);
})();
