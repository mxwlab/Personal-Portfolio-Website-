(()=>{
 const group=document.querySelector('.project-build-demo'),panel=group?.querySelector('.project-fill');
 if(!group||!panel)return;
 let shown=false;
 const reveal=()=>{
  if(shown)return;shown=true;group.dataset.demonstrated='true';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  panel.animate([{opacity:.65,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});
 };
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){reveal();observer.disconnect();}},{rootMargin:'-54px 0px -30% 0px',threshold:.25});
 observer.observe(group);
})();
