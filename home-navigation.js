// Native fragment links own URL/history/focus; scrolling only updates the current section.
(() => {
  const sections=[...document.querySelectorAll('[data-home-section]')];
  const allLinks=[...document.querySelectorAll('.site-header [data-home-link]')];
  const links=allLinks.filter(link=>new URL(link.href).pathname.replace(/index\.html$/, '')===location.pathname.replace(/index\.html$/, ''));
  allLinks.filter(link=>!links.includes(link)).forEach(link=>link.removeAttribute('aria-current'));
  if(!sections.length||!links.length)return;
  const root=document.documentElement;
  root.classList.add('single-page-home');
  let scheduled=false;
  const offset=()=>Math.ceil(document.querySelector('.site-header').getBoundingClientRect().bottom)+20;
  function update(){
    scheduled=false;
    const line=offset();root.style.setProperty('--home-anchor-offset',`${line}px`);
    if(document.querySelector('dialog[open]'))return;
    const atEnd=scrollY+innerHeight>=document.documentElement.scrollHeight-3;
    const active=atEnd?sections.at(-1):sections.filter(s=>s.getBoundingClientRect().top<=line+8).at(-1)||sections[0];
    for(const link of links){
      if(link.dataset.homeLink===active.id||(link.dataset.homeLink==='home'&&!links.some(item=>item.dataset.homeLink===active.id)))link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('hashchange',schedule);
  addEventListener('popstate',schedule);
  addEventListener('pageshow',schedule);
  document.addEventListener('portfoliofilterchange',schedule);
  document.addEventListener('close',schedule,true);
  const settle=()=>{
    update();
    if(!location.hash)return;
    let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
    const target=document.getElementById(id);
    if(target)scrollTo({top:Math.max(0,scrollY+target.getBoundingClientRect().top-offset()),behavior:'instant'});
    update();
  };
  addEventListener('load',()=>document.fonts.ready.then(settle),{once:true});
  // Lazy media above a target can grow after the jump; re-align a few times so "联系" lands on the contact block.
  const realign=()=>{let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
    if(!id)return;
    [300,800,1500,2500].forEach(ms=>setTimeout(()=>{const el=document.getElementById(id);if(!el)return;
      const d=el.getBoundingClientRect().top-offset();if(Math.abs(d)>6)scrollTo({top:Math.max(0,scrollY+d),behavior:'instant'});update();},ms));};
  addEventListener('hashchange',realign);
  addEventListener('load',realign,{once:true});
  document.addEventListener('click',e=>{const a=e.target.closest('.site-header a[href$="#contact"]');if(a&&location.hash==='#contact')realign();});
  update();
})();
