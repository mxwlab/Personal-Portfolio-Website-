// Independent anchors and touch behavior; other project pages do not load this file.
(() => {
  const rail = document.querySelector('.iv3-rail');
  const chapters = [...document.querySelectorAll('[data-v3-chapter]')];
  if (!rail || !chapters.length) return;
  const links = [...rail.querySelectorAll('a')];
  const side = () => matchMedia('(min-width:1440px)').matches;
  const offset = () => (document.querySelector('.project-return-nav,.site-header')?.getBoundingClientRect().height || 60) + (side() ? 0 : rail.getBoundingClientRect().height || 54) + 16;
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

// One width-fit viewer for every evidence image on this case page.
(() => {
  const dialog=document.querySelector('#image-dialog');
  const img=dialog?.querySelector('img');
  if(!dialog||!img)return;
  const close=dialog.querySelector('.dialog-close');
  const caption=dialog.querySelector('.dialog-caption');
  const area=document.createElement('div');
  area.className='iv3-dialog-image-area';
  area.tabIndex=0;
  area.setAttribute('role','region');
  area.setAttribute('aria-label','图片内容，可向下滚动查看');
  img.before(area);area.append(img);
  let trigger,position,previousOverflow;
  document.querySelectorAll('[data-zoom]').forEach(button=>{
    button.addEventListener('click',event=>{
      if(!dialog.showModal)return;
      event.preventDefault();event.stopImmediatePropagation();
      trigger=button;position={left:scrollX,top:scrollY};
      previousOverflow=document.documentElement.style.overflow;
      document.documentElement.style.overflow='hidden';
      img.src=button.dataset.zoom;
      img.alt=button.dataset.alt||button.querySelector('img')?.alt||'作品图片';
      caption.textContent=img.alt;
      area.scrollTo(0,0);dialog.scrollTo(0,0);
      dialog.showModal();
      close.focus({preventScroll:true});
      area.scrollTo({top:0,left:0,behavior:'instant'});dialog.scrollTo(0,0);
    },true);
  });
  dialog.addEventListener('close',event=>{
    // Replace the shared viewer's focus restoration, which can scroll the page.
    event.stopImmediatePropagation();
    img.removeAttribute('src');area.scrollTo(0,0);
    document.documentElement.style.overflow=previousOverflow;
    trigger?.focus({preventScroll:true});
    if(position)scrollTo({...position,behavior:'instant'});
  },true);
})();
