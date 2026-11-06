/* 3-minute overview: top-bar launch button, first-visit nudge, side drawer / bottom sheet */
(()=>{
 const root=document.querySelector('.qv-root');if(!root)return;
 const bar=document.querySelector('.project-return-nav,.topbar');if(!bar)return;
 const sheet=root.querySelector('.qv-sheet'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 let btn=bar.querySelector('.qv-launch');
 if(!btn){btn=document.createElement('button');btn.type='button';btn.className='qv-launch';btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-controls',root.id);btn.innerHTML='<span>3 分钟速览</span>';bar.appendChild(btn);}
 // The chapter links are inserted by another script; keep the button last.
 const keepLast=()=>{if(bar.lastElementChild!==btn)bar.appendChild(btn)};keepLast();new MutationObserver(keepLast).observe(bar,{childList:true});
 let last=null,tip=null;
 const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
 const hideTip=()=>{if(!tip)return;tip.classList.remove('is-shown');btn.classList.remove('is-calling');const t=tip;tip=null;setTimeout(()=>t.remove(),320)};
 const open=()=>{
  hideTip();store.set('qv-seen','1');last=document.activeElement;
  root.hidden=false;document.documentElement.classList.add('qv-lock');
  requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('is-open')));
  btn.setAttribute('aria-expanded','true');countUp();setTimeout(()=>sheet.focus({preventScroll:true}),60);
 };
 const close=(after)=>{
  root.classList.remove('is-open');btn.setAttribute('aria-expanded','false');
  setTimeout(()=>{root.hidden=true;document.documentElement.classList.remove('qv-lock');(last||btn).focus?.({preventScroll:true});if(after)after();},reduce.matches?0:420);
 };
 const countUp=()=>{for(const el of root.querySelectorAll('[data-count]')){const to=+el.dataset.count;if(reduce.matches){el.textContent=to;continue}const t0=performance.now()+250,d=900;el.textContent='0';const step=t=>{const k=Math.min(1,Math.max(0,(t-t0)/d));el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}};
 btn.addEventListener('click',open);
 root.addEventListener('click',e=>{if(e.target.closest('[data-qv-close]'))close();});
 for(const a of root.querySelectorAll('.qv-map a,.qv-more a'))a.addEventListener('click',e=>{
  e.preventDefault();const id=a.getAttribute('href');last=null;
  close(()=>{location.hash=id;});
 });
 document.addEventListener('keydown',e=>{
  if(root.hidden)return;
  if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key==='Tab'){const f=[...sheet.querySelectorAll('a,button')];if(!f.length)return;const a=f[0],z=f[f.length-1];
   if(e.shiftKey&&(document.activeElement===a||document.activeElement===sheet)){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
 });
 // Keep page-level wheel handlers (D4S paging) away while the drawer is open.
 addEventListener('wheel',e=>{if(root.hidden)return;e.stopImmediatePropagation();if(!e.target.closest('.qv-sheet-body'))e.preventDefault();},{capture:true,passive:false});
 // First visit: the button rings and a short tip appears, then both go away on their own.
 if(!store.get('qv-seen')){
  setTimeout(()=>{
   if(!root.hidden)return;
   tip=document.createElement('div');tip.className='qv-tip';tip.setAttribute('role','status');
   tip.innerHTML='<b>时间有限？先看这里</b>3 分钟看完项目问题、我的判断和结果。';
   tip.style.fontFamily=getComputedStyle(btn).fontFamily;document.body.appendChild(tip);
   const r=btn.getBoundingClientRect(),w=Math.min(260,innerWidth-32);
   const left=Math.max(16,Math.min(innerWidth-w-16,r.right-w));
   tip.style.left=left+'px';tip.style.top=(r.bottom+12)+'px';tip.style.width=w+'px';
   tip.style.setProperty('--qv-tip-arrow',Math.max(14,Math.min(w-26,r.left+r.width/2-left-6))+'px');
   tip.addEventListener('click',open);
   requestAnimationFrame(()=>tip&&tip.classList.add('is-shown'));
   if(!reduce.matches)btn.classList.add('is-calling');
   setTimeout(hideTip,6500);
  },1000);
  addEventListener('scroll',()=>{if(tip&&scrollY>200)hideTip()},{passive:true});
 }
})();
