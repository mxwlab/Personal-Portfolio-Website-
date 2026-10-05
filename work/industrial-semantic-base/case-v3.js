// Independent anchors; the existing project navigation stays separate.
(() => {
  const rail = document.querySelector('.iv3-rail');
  const chapters = [...document.querySelectorAll('[data-v3-chapter]')];
  if (!rail || !chapters.length) return;
  const links = [...rail.querySelectorAll('a')];
  const side = () => matchMedia('(min-width:1440px)').matches;
  const offset = () => (document.querySelector('.site-header')?.getBoundingClientRect().height || 70) + (side() ? 0 : 54) + 16;
  let scheduled = false;
  function update() {
    scheduled = false;
    const started = chapters[0].getBoundingClientRect().top <= offset() + 5;
    rail.hidden = !started;
    const active = chapters.filter(chapter => chapter.getBoundingClientRect().top <= offset() + 8).at(-1) || chapters[0];
    for (const link of links) {
      if (started && link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
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
