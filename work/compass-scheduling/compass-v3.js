// Adapted from the current industrial v3 interactions; loaded only by Compass.
(() => {
  const rail=document.querySelector('.cv3-rail'),chapters=[...document.querySelectorAll('[data-cv3-chapter]')];
  if(!rail||!chapters.length)return;
  const links=[...rail.querySelectorAll('a')],side=()=>matchMedia('(min-width:1440px)').matches;
  const headerHeight=()=>document.querySelector('.site-header')?.getBoundingClientRect().height||60;
  const offset=()=>headerHeight()+(side()?0:rail.getBoundingClientRect().height||54)+16;
  let scheduled=false,activeId='';
  function update(){
    scheduled=false;document.body.style.setProperty('--cv3-header-height',`${headerHeight()}px`);
    const inset=offset();document.body.style.setProperty('--cv3-reading-offset',`${inset}px`);
    const started=chapters[0].getBoundingClientRect().top<=inset+5;rail.hidden=!started;
    const atEnd=scrollY+innerHeight>=document.documentElement.scrollHeight-4;
    const active=atEnd?chapters.at(-1):chapters.filter(c=>c.getBoundingClientRect().top<=inset+8).at(-1)||chapters[0];
    const dark=[...document.querySelectorAll('.cv3-dark')].map(e=>e.getBoundingClientRect());
    for(const link of links){
      if(started&&link.hash==='#'+active.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
      const box=link.getBoundingClientRect(),line=(box.top+box.bottom)/2;
      link.classList.toggle('is-over-dark',side()&&dark.some(r=>r.top<=line&&r.bottom>=line));
    }
    if(started&&!side()&&activeId!==active.id){const link=links.find(a=>a.hash==='#'+active.id);rail.scrollTo({left:link.offsetLeft-(rail.clientWidth-link.offsetWidth)/2,behavior:'instant'});}
    activeId=started?active.id:'';
  }
  function locate(hash){const target=chapters.find(c=>'#'+c.id===hash);if(!target)return;scrollTo({top:target.getBoundingClientRect().top+scrollY-offset(),behavior:'instant'});update();}
  for(const link of links)link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.replaceState(null,'',link.hash);locate(link.hash);});
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}},{passive:true});
  addEventListener('resize',update);addEventListener('hashchange',()=>locate(location.hash));
  document.fonts.ready.then(()=>{if(location.hash)locate(location.hash);update();});update();
})();

(() => {
  const dialog=document.querySelector('#image-dialog'),img=dialog?.querySelector('img');if(!dialog||!img)return;
  const area=document.createElement('div');area.className='cv3-dialog-image-area';img.before(area);area.append(img);
  const zoom=document.createElement('button');zoom.type='button';zoom.className='cv3-dialog-zoom';zoom.textContent='原图尺寸';zoom.setAttribute('aria-pressed','false');dialog.querySelector('.dialog-close').after(zoom);
  const reset=()=>{dialog.classList.remove('is-detail-zoomed');zoom.textContent='原图尺寸';zoom.setAttribute('aria-pressed','false');area.scrollTo(0,0);};
  zoom.addEventListener('click',()=>{const enabled=!dialog.classList.contains('is-detail-zoomed');dialog.style.setProperty('--cv3-original-width',`${img.naturalWidth}px`);dialog.classList.toggle('is-detail-zoomed',enabled);zoom.textContent=enabled?'适合屏幕':'原图尺寸';zoom.setAttribute('aria-pressed',String(enabled));area.scrollTo(0,0);});
  dialog.addEventListener('keydown',event=>{if(event.key!=='Tab')return;event.preventDefault();event.stopImmediatePropagation();const controls=[dialog.querySelector('.dialog-close'),zoom],index=controls.indexOf(document.activeElement);controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();},true);
  dialog.addEventListener('close',reset);
})();
