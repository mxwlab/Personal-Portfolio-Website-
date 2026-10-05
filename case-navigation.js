// One controller for every case; independent of project slugs and block types.
(() => {
  const rail = document.querySelector('[data-case-navigation]');
  const reading = document.querySelector('[data-case-reading]');
  if (!rail || !reading) return;
  const links = [...rail.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  if (sections.some(section => !section)) return;
  const side = () => matchMedia('(min-width:1440px)').matches;
  const offset = () => (document.querySelector('.site-header')?.getBoundingClientRect().height || 0)
    + (side() ? 0 : rail.getBoundingClientRect().height) + 16;
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const visible = reading.getBoundingClientRect().top <= offset() + 1;
    rail.classList.toggle('is-reading', visible);
    rail.inert = !visible;
    rail.setAttribute('aria-hidden', String(!visible));
    let active = sections.filter(section => section.getBoundingClientRect().top <= offset() + 8).at(-1) || sections[0];
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) active = sections.at(-1);
    links.forEach(link => {
      const selected = link.hash === '#' + active.id;
      const changed = selected && !link.hasAttribute('aria-current');
      if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      if (changed && visible) {
        const strip = link.parentElement, box = link.getBoundingClientRect(), bounds = strip.getBoundingClientRect();
        if (side()) {
          if (box.top < bounds.top || box.bottom > bounds.bottom) strip.scrollTop += box.top - bounds.top;
        } else if (box.left < bounds.left || box.right > bounds.right) strip.scrollLeft += box.left - bounds.left - 12;
      }
    });
  };
  const locate = hash => {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    if (target instanceof HTMLDetailsElement) target.open = true;
    window.scrollTo({top: scrollY + target.getBoundingClientRect().top - offset(), behavior: 'instant'});
    update();
  };
  [...links, ...document.querySelectorAll('.scene-nav a')].forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();history.replaceState(null, '', link.hash);locate(link.hash);
  }));
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, {passive:true});
  addEventListener('resize', update);
  addEventListener('hashchange', () => locate(location.hash));
  addEventListener('load', () => { if (location.hash) locate(location.hash); else update(); }, {once:true});
  if (location.hash) requestAnimationFrame(() => locate(location.hash)); else update();
})();
