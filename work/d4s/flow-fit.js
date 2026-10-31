/* One complete workflow screen with on-demand notes; preserve the existing structure intro. */
(()=>{
const shell=document.getElementById('board-6'),board=shell.querySelector(':scope>.board'),root=board.firstElementChild,q=id=>root.querySelector(`[data-node-id="${id}"]`);
const flow=q('2167:9642'),holder=document.createElement('div');holder.className='flow-complete';holder.dataset.readingGroup='完整三端业务流程';holder.style.position='absolute';root.append(holder);holder.append(flow);
const notes=['2167:9826','2167:9848','2167:9828','2167:9838'].map(id=>q(id).textContent.trim());
for(const id of ['2167:9641','2167:9817','2167:9827','2167:9837','2167:9847']){q(id).style.display='none';shell.querySelector(`.mobile-section [data-source-node="${id}"]`)?.remove();}
const markerIds=['2167:9804','2167:9808','2167:9713','2167:9717'];
const panel=document.createElement('aside');panel.id='flow-note';panel.className='flow-note';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','flow-note-title');panel.innerHTML='<div class="flow-note-heading"><strong id="flow-note-title"></strong><button type="button" aria-label="关闭交互说明">×</button></div><p></p>';document.body.append(panel);
let active=null,pinned=false,hideTimer=0,entryTimer=0,introduced=false,suppressFocus=false;
const hint=document.createElement('p');hint.className='flow-discovery-hint';shell.append(hint);
const close=(restore=false)=>{clearTimeout(hideTimer);const old=active;active=null;pinned=false;panel.hidden=true;buttons.forEach(b=>b.setAttribute('aria-expanded','false'));if(restore){suppressFocus=true;old?.focus({preventScroll:true});suppressFocus=false;}};
const positionPanel=()=>{
 if(!active)return;
 if(innerWidth<=600){Object.assign(panel.style,{width:'calc(100vw - 24px)',left:'12px',top:'auto',bottom:'12px'});return;}
 // Both rectangles are viewport coordinates. Never apply the diagram scale again.
 const r=active.getBoundingClientRect(),gap=10,edge=12,menu=document.querySelector('.topbar').getBoundingClientRect().bottom;
 if(r.bottom<menu||r.top>innerHeight){close();return;}
 const others=buttons.filter(b=>b!==active&&!b.hidden).map(b=>b.getBoundingClientRect()),options=[];
 for(const side of ['right','left']){
  const space=side==='right'?innerWidth-edge-r.right-gap:r.left-gap-edge;
  if(space<260)continue;
  const w=Math.min(340,space);panel.style.width=w+'px';const h=panel.offsetHeight;
  const x=side==='right'?r.right+gap:r.left-gap-w;
  for(const wanted of [r.top+(r.height-h)/2,r.top,r.bottom-h]){
   const y=Math.max(menu+edge,Math.min(wanted,innerHeight-h-edge));
   const overlaps=others.reduce((sum,b)=>sum+Math.max(0,Math.min(x+w,b.right)-Math.max(x,b.left))*Math.max(0,Math.min(y+h,b.bottom)-Math.max(y,b.top)),0);
   options.push({x,y,w,score:overlaps*100+Math.abs(y+h/2-r.top-r.height/2)+(side==='left'?1:0)});
  }
 }
 const best=options.sort((a,b)=>a.score-b.score)[0];
 if(best)Object.assign(panel.style,{width:best.w+'px',left:best.x+'px',top:best.y+'px',bottom:'auto'});
 else{panel.style.width=Math.min(340,innerWidth-24)+'px';const h=panel.offsetHeight;Object.assign(panel.style,{left:Math.max(edge,Math.min(r.left,innerWidth-panel.offsetWidth-edge))+'px',top:Math.max(menu+edge,Math.min(r.bottom+gap,innerHeight-h-edge))+'px',bottom:'auto'});}
};
const show=(b,i,fix=false)=>{clearTimeout(hideTimer);active=b;pinned=fix;introduced=true;buttons.forEach(x=>x.setAttribute('aria-expanded',String(x===b)));panel.querySelector('strong').textContent=`交互说明 ${i+1}`;panel.querySelector('p').textContent=notes[i];panel.hidden=false;positionPanel();};
const deferClose=()=>{clearTimeout(hideTimer);if(!pinned)hideTimer=setTimeout(()=>close(),900);};
const buttons=markerIds.map((id,i)=>{const b=document.createElement('button');b.type='button';b.className='flow-hotspot';b.setAttribute('aria-label',`交互说明 ${i+1}`);b.setAttribute('aria-controls',panel.id);b.setAttribute('aria-expanded','false');shell.append(b);
 b.addEventListener('click',()=>{if(active===b&&pinned){close();return;}show(b,i,true);});
 b.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'&&matchMedia('(hover:hover)').matches&&!pinned)show(b,i);});
 b.addEventListener('pointerleave',deferClose);
 b.addEventListener('focus',()=>{if(!suppressFocus&&!pinned)show(b,i);});
 b.addEventListener('blur',e=>{if(!panel.contains(e.relatedTarget))deferClose();});return b;});
panel.addEventListener('pointerenter',()=>clearTimeout(hideTimer));panel.addEventListener('pointerleave',deferClose);
panel.addEventListener('focusin',()=>clearTimeout(hideTimer));panel.addEventListener('focusout',e=>{if(!panel.contains(e.relatedTarget))deferClose();});
panel.querySelector('button').addEventListener('click',()=>close(true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();close(true);}});
document.addEventListener('pointerdown',e=>{if(active&&!panel.contains(e.target)&&!e.target.closest('.flow-hotspot'))close();});
const checkEntry=()=>{if(introduced)return;const r=shell.getBoundingClientRect(),menu=document.querySelector('.topbar').offsetHeight;if(r.top<menu+100&&r.bottom>innerHeight*.65&&!buttons[0].hidden)show(buttons[0],0,true);};
addEventListener('scroll',()=>{if(active){const r=active.getBoundingClientRect();if(r.bottom<54||r.top>innerHeight)close();else positionPanel();}clearTimeout(entryTimer);entryTimer=setTimeout(checkEntry,180);},{passive:true});
const placeButtons=()=>{const mobile=innerWidth<=600,base=shell.getBoundingClientRect();markerIds.forEach((id,i)=>{const n=shell.querySelector(`${mobile?'.mobile-section':':scope>.board'} [data-node-id="${id}"]`);if(!n)return;n.style.visibility='visible';n.parentElement.style.overflow='visible';if(mobile){n.style.scale=String(16/(16*.68));n.style.transformOrigin='left center';}const r=n.getBoundingClientRect();const clip=n.closest('.mobile-visual')?.getBoundingClientRect();buttons[i].hidden=!!(mobile&&clip&&(r.left<clip.left||r.right>clip.right));Object.assign(buttons[i].style,{left:(r.left-base.left-4)+'px',top:(r.top-base.top+(r.height-44)/2)+'px',width:(r.width+8)+'px',height:'44px'});});
 hint.textContent=mobile?'点击序号查看说明':'悬停或点击序号查看说明';
 const anchor=mobile?shell.querySelector('.mobile-visual'):holder;const r=anchor.getBoundingClientRect();Object.assign(hint.style,{left:(r.left-base.left)+'px',top:(r.top-base.top-25)+'px'});
 positionPanel();clearTimeout(entryTimer);entryTimer=setTimeout(checkEntry,200);
};
const structure=document.querySelector('#board-5>.board'),sq=id=>structure.querySelector(`[data-node-id="${id}"]`);
const movers=[sq('2382:2139'),...['2382:2164','2382:2197','2382:2230','2382:2300'].map(sq),...[...sq('2382:2143').children].filter(n=>!['2382:2156','2382:2163'].includes(n.dataset.nodeId))];
const original=movers.map(n=>parseFloat(getComputedStyle(n).top));
const mobileTitle=document.querySelector('#board-5 .mobile-copy[data-source-node="2382:2163"]'),mobileIntro=document.querySelector('#board-5 .mobile-copy[data-source-node="2382:2156"]');mobileTitle.after(mobileIntro);
window.layoutD4SFlow=()=>{
 if(innerWidth<=600){
 const mf=shell.querySelector('.mobile-section [data-node-id="2167:9642"]'),visual=mf?.closest('.mobile-visual');
 if(visual){visual.classList.add('flow-mobile-scroll');visual.tabIndex=0;visual.setAttribute('role','region');visual.setAttribute('aria-label','三端业务流程，可横向滚动查看');visual.style.maxWidth='none';visual.style.height='680px';const canvas=visual.firstElementChild;canvas.style.width='1685px';canvas.style.height='971px';canvas.style.transform='scale(.68)';visual.addEventListener('scroll',placeButtons,{passive:true});}
 placeButtons();return;
 }
 const scale=board.getBoundingClientRect().width/1920,available=innerHeight-document.querySelector('.topbar').offsetHeight;
 const title=q('2167:9812'),intro=q('2167:9815');title.style.top=92/scale+'px';intro.style.top=(92+title.getBoundingClientRect().height+10)/scale+'px';q('2167:9816').style.display='none';
 const start=(intro.offsetTop+intro.offsetHeight)*scale+40,diagramHeight=Math.max(300,available-start-16);
 Object.assign(holder.style,{left:'80px',top:start/scale+'px',width:'1760px',height:diagramHeight/scale+'px'});
 const kx=1760/1685,ky=Math.min(kx,diagramHeight/scale/971);
 Object.assign(flow.style,{left:'0px',top:'0px',transform:`scale(${kx},${ky})`,transformOrigin:'0 0'});
 for(const p of flow.querySelectorAll('p')){p.style.scale=`1 ${kx/ky}`;p.style.transformOrigin='center';}
 for(const id of markerIds){const m=q(id);m.parentElement.style.overflow='visible';const zoom=16/(16*scale*kx);m.style.scale=`${zoom} ${kx/ky*zoom}`;m.style.transformOrigin='left center';for(const p of m.querySelectorAll('p'))p.style.scale='none';}
 // The five vertical branch labels need real line spacing, not enlarged glyphs in compressed boxes.
 const sy=scale*ky,branch=q('2167:9752'),branchHeight=96/sy;
 for(const id of ['2167:9755','2167:9757','2167:9759','2167:9761','2167:9763']){
  const cell=q(id),stack=cell.firstElementChild;cell.style.height=branchHeight+'px';stack.style.height=80/sy+'px';
  for(const p of stack.children){Object.assign(p.style,{height:20/sy+'px',margin:'0',display:'grid',placeItems:'center',lineHeight:'normal'});}
 }
 branch.style.height=(101.25+branchHeight+12/sy)+'px';
 const total=Math.max(available,start+diagramHeight+16);root.style.height=total/scale+'px';board.style.height=total/scale+'px';shell.style.height=total+'px';board.style.top='0px';
 placeButtons();
 const ss=structure.getBoundingClientRect().width/1920,st=sq('2382:2163'),si=sq('2382:2156');
 // Reset source geometry only during the full layout pass; typography observers must not move this title.
 st.style.top=(227-32/ss)+'px';
 Object.assign(si.style,{left:st.offsetLeft+'px',top:(st.offsetTop+st.offsetHeight+10/ss)+'px',width:'1664px',textAlign:'left'});
 const delta=Math.max(0,si.offsetTop+si.offsetHeight+32/ss-304);movers.forEach((n,i)=>n.style.top=(original[i]+delta)+'px');
 // Trim the source canvas tail, then use only existing inter-group whitespace to fit the screen.
 structure.style.top='0px';
 const content=[st,si,...movers.filter(n=>n.dataset.nodeId!=='2382:2139')];
 const base=structure.getBoundingClientRect().top;
 const bottom=()=>Math.max(...content.map(n=>n.getBoundingClientRect().bottom-base));
 const lift=Math.min(24,Math.max(0,st.getBoundingClientRect().top-base-78));
 for(const n of content)n.style.top=(parseFloat(n.style.top)-lift/ss)+'px';
 let excess=Math.max(0,bottom()+24-available);
 const first=Math.min(20,excess);for(const n of movers.filter(n=>n.dataset.nodeId!=='2382:2139'))n.style.top=(parseFloat(n.style.top)-first/ss)+'px';
 excess=Math.max(0,bottom()+24-available);
 const second=Math.min(24,excess);for(const n of movers.filter(n=>n.dataset.nodeId!=='2382:2139'&&!['2382:2147','2382:2148','2382:2149','2382:2160','2382:2161','2382:2162'].includes(n.dataset.nodeId)))n.style.top=(parseFloat(n.style.top)-second/ss)+'px';
 const tail=Math.max(0,bottom()+20-available);structure.style.top=-tail+'px';
 const sh=Math.max(available,bottom()+20);structure.firstElementChild.style.height=sh/ss+'px';structure.style.height=sh/ss+'px';structure.parentElement.style.height=Math.max(available,sh-tail)+'px';
 // The source full-canvas decorative background must end with this section too.
 const backdrop=sq('2382:2139');backdrop.style.top='0px';backdrop.style.height=sh/ss+'px';

};
})();
