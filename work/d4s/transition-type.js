/* Fit this single transition sentence to the existing content boundaries. */
(()=>{
 const text='这些变化是怎么发生的？';
 const desktop=document.querySelector('.board-shell>.board [data-node-id="2382:2098"] p');
 const mobile=[...document.querySelectorAll('.mobile-copy')].find(n=>n.textContent.trim()===text);
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 const fit=(p,width,scale)=>{
  const s=getComputedStyle(p);ctx.font=`${s.fontWeight} 100px ${s.fontFamily}`;
  p.style.fontSize=(100*width/scale/ctx.measureText(text).width)+'px';p.style.lineHeight='1.2';p.style.whiteSpace='nowrap';p.style.color='#9B9B9B';p.style.letterSpacing='0';p.style.wordBreak='normal';p.style.textAlign='center';p.style.width='100%';
 };
 const update=()=>{
  if(innerWidth>600&&desktop){
   const box=desktop.parentElement;box.style.transform='none';
   const gutter=parseFloat(getComputedStyle(document.querySelector('.topbar')).paddingLeft),width=innerWidth-2*gutter;
   const ratio=box.getBoundingClientRect().width/box.offsetWidth;
   box.style.width=width/ratio+'px';fit(desktop,width,ratio);
   const shift=(gutter-box.getBoundingClientRect().left)/ratio;box.style.transform=`translateX(${shift}px)`;
  }else if(mobile)fit(mobile,mobile.parentElement.clientWidth,1);
 };
 let pending=false;const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;update();})}};
 addEventListener('resize',schedule);addEventListener('load',schedule);document.fonts?.ready.then(schedule);schedule();
})();
