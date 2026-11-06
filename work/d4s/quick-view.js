/* 3-minute overview drawer: opens in place between the cover and the next screen */
(()=>{
 for(const box of document.querySelectorAll('.qv-drawer')){
  const btn=box.querySelector('.qv-toggle'),panel=box.querySelector('.qv-panel'),state=box.querySelector('.qv-toggle-state');
  const set=open=>{
   box.classList.toggle('is-open',open);btn.setAttribute('aria-expanded',open);
   if(open)panel.removeAttribute('inert');else panel.setAttribute('inert','');
   state.textContent=open?state.dataset.open:state.dataset.closed;
  };
  btn.addEventListener('click',()=>{
   const open=!box.classList.contains('is-open');set(open);
   if(open){
    const bar=document.querySelector('.topbar,.project-return-nav');
    const offset=bar?bar.getBoundingClientRect().bottom:0;
    const top=box.getBoundingClientRect().top+scrollY-offset;
    scrollTo({top,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
   }
  });
  if(location.hash==='#'+box.id)set(true);
 }
})();
