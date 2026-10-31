(()=>{'use strict';
let navigationDock=null;
const clearNavigationDock=()=>{navigationDock=null;};
for(const event of ['wheel','touchstart','keydown'])addEventListener(event,clearNavigationDock,{passive:true});
addEventListener('pointerdown',e=>{if(!e.target.closest('.chapter-links'))clearNavigationDock();},{passive:true});
const shells=[...document.querySelectorAll('.board-shell:not(.results-native):not(.journey-native):not(.project-native):not(.task-native)')];
const resize=()=>{
 const roleShell=document.getElementById('board-4'),menu=document.querySelector('.topbar');
 const roleTop=roleShell.getBoundingClientRect().top;
 const roleWasDocked=innerWidth>600&&location.hash==='#board-4'&&Math.abs(roleTop-menu.offsetHeight)<innerHeight/2;
 const isMobile=matchMedia('(max-width:600px)').matches;
 if(!isMobile)for(const n of document.querySelectorAll('#board-1.results-native h2,#board-8 .project-intro h2'))n.style.removeProperty('margin-bottom');
 for(const visual of document.querySelectorAll('.mobile-visual')){const scale=visual.clientWidth/Number(visual.dataset.width),canvas=visual.firstElementChild;visual.style.height=Number(visual.dataset.height)*scale+'px';canvas.style.width=visual.dataset.width+'px';canvas.style.height=visual.dataset.height+'px';canvas.style.transform=`scale(${scale})`;}
 const gutter=parseFloat(getComputedStyle(document.querySelector('.topbar')).paddingLeft);
 if(!isMobile){for(const shell of shells){const board=shell.querySelector(':scope>.board'),scale=(shell.clientWidth-2*gutter)/1760;board.style.transform=`scale(${scale})`; }window.layoutD4SChapterType?.();}
 window.layoutD4SReadingType?.();window.fitD4SReadingBoxes?.();
 for(const shell of shells){
 shell.querySelector(':scope > .board').setAttribute('aria-hidden',String(isMobile));shell.querySelector('.mobile-section').setAttribute('aria-hidden',String(!isMobile));
 if(isMobile){shell.style.height='auto';continue;}
  const scale=(shell.clientWidth-2*gutter)/1760,offset=gutter-80*scale,board=shell.querySelector('.board');
  board.style.transform=`scale(${scale})`;board.style.left=offset+'px';board.style.position='absolute';board.style.height=shell.dataset.height+'px';
  const sourceHeight=Number(shell.dataset.height)*scale;
  const available=Math.max(0,innerHeight-document.querySelector('.topbar').offsetHeight);
  const shortSection=['board-1','board-3','board-5'].includes(shell.id);
  shell.style.height=(shortSection?Math.max(sourceHeight,available):sourceHeight)+'px';
  board.style.top=shortSection?Math.max(0,(available-sourceHeight)/2)+'px':'0px';
  if(shell.id==='board-0'){
   const coverHeight=Math.max(available,694*scale+48);
   shell.style.height=coverHeight+'px';
   board.style.setProperty('--cover-copy-top',Math.min(167.23,Math.max(24,(coverHeight-694*scale)/2/scale))+'px');
   board.style.setProperty('--cover-ui-top',Math.min(96.73,Math.max(24,(coverHeight-835*scale-60)/2/scale))+'px');
   board.style.setProperty('--cover-ui-scale',Math.min(1,(coverHeight-60)/(835*scale)));
   const note=board.querySelector('[data-node-id="2395:13604"]');
   note.style.left='auto';note.style.right=(1920-(shell.clientWidth-80-offset)/scale)+'px';note.style.textAlign='right';
   board.style.setProperty('--cover-note-top',(coverHeight-80-note.getBoundingClientRect().height)/scale+'px');
  }
  const groupedHeight=window.layoutD4SReadingGroups?.(scale,Math.max(0,available),shell);if(groupedHeight!==null&&groupedHeight!==undefined)shell.style.height=groupedHeight+'px';
  shell.style.backgroundColor=getComputedStyle(board.firstElementChild).backgroundColor;
  if(shell.id==='board-0')board.style.setProperty('--cover-image-left',((shell.clientWidth-offset)/scale-1128)+'px');
  shell.querySelectorAll('.surface-bleed').forEach(n=>n.remove());
  const bounds=board.getBoundingClientRect();
  for(const node of board.querySelectorAll('div')){
   const rect=node.getBoundingClientRect(),color=getComputedStyle(node).backgroundColor;
   if(rect.width<bounds.width*.98||rect.height<30||color==='rgba(0, 0, 0, 0)'||color==='transparent')continue;
   const bleed=document.createElement('div');bleed.className='surface-bleed';bleed.setAttribute('aria-hidden','true');bleed.style.cssText=`top:${rect.top-bounds.top}px;height:${rect.height}px;background:${color}`;shell.insertBefore(bleed,board);
  }
 }
 window.compactD4SHeaders?.();
 window.layoutD4SFlow?.();
 // Center the complete role content below the fixed chapter rail, not the whole board.
 if(!isMobile){
  const board=roleShell.querySelector(':scope>.board'),scale=board.getBoundingClientRect().width/1920;
  const nodes=['2382:2430','role-intro','2167:10147','2382:2405','2382:2434'].map(id=>board.querySelector(`[data-node-id="${id}"]`));
  const shellTop=roleShell.getBoundingClientRect().top;
  const wave=roleShell.querySelector('.desktop-portfolio-rail .portfolio-wave');
  const areaTop=wave?wave.getBoundingClientRect().bottom-shellTop:68;
  const contentTop=Math.min(...nodes.map(n=>n.getBoundingClientRect().top-shellTop));
  const contentBottom=Math.max(...nodes.map(n=>n.getBoundingClientRect().bottom-shellTop));
  const contentHeight=contentBottom-contentTop;
  const height=Math.max(innerHeight-menu.offsetHeight,areaTop+contentHeight+32);
  roleShell.style.height=height+'px';
  const shift=(92-contentTop)/scale;
  roleShell.style.height=Math.max(innerHeight-menu.offsetHeight,92+contentHeight+32)+'px';
  for(const n of nodes)n.style.top=(parseFloat(n.style.top)+shift)+'px';
  if(roleWasDocked){const dockRole=()=>scrollTo({top:roleShell.getBoundingClientRect().top+scrollY-menu.offsetHeight,behavior:'instant'});dockRole();requestAnimationFrame(()=>requestAnimationFrame(dockRole));}
 }
 // Trim only the blank tails identified in the review, after header alignment.
 // Each resize rebuilds source geometry first, so this never compounds.
 if(!isMobile){
  for(const id of ['board-11','board-12','board-13']){
   const shell=document.getElementById(id),root=shell.querySelector(':scope>.board>div');
   const end=id==='board-6'?root.querySelector('[data-node-id="2167:9847"]'):id==='board-11'?root.querySelector('[data-node-id="2392:2892"]'):id==='board-13'?root.querySelector('[data-node-id="2321:2854"]'):root.lastElementChild;
   if(!end)continue;
   const bottom=end.getBoundingClientRect().bottom-shell.getBoundingClientRect().top;
   const oldGap=Math.max(0,shell.getBoundingClientRect().height-bottom);
   const gap=['board-6','board-13'].includes(id)?oldGap/2:Math.min(120,Math.max(72,innerWidth*.075));
   shell.style.height=(bottom+Math.min(oldGap,gap))+'px';
  }
 }

 // Two existing evidence groups side by side; source UI scales uniformly.
 if(!isMobile){
  for(const id of ['board-12','board-13']){
   const shell=document.getElementById(id),board=shell.querySelector(':scope>.board'),root=board.firstElementChild;
   const scale=board.getBoundingClientRect().width/1920,col=856,gap=48;
   const q=id=>root.querySelector(`[data-node-id="${id}"]`);
   const place=(n,x,y,w)=>{Object.assign(n.style,{position:'absolute',left:x+'px',top:y+'px',width:w+'px',margin:'0'});n.style.setProperty('width',w+'px','important');n.style.setProperty('min-width','0','important');};
   const text=(n,x,y)=>{place(n,x,y,col);n.style.height='auto';for(const p of n.querySelectorAll('p')){Object.assign(p.style,{position:'static',width:'100%',height:'auto',margin:'0',transform:'none'});}return n.offsetHeight;};
   const visual=(n,x,y,h)=>{place(n,x,y,1760);n.style.transform=`scale(${col/1760})`;n.style.transformOrigin='top left';return h*col/1760;};
   let bottom;
   if(id==='board-12'){
    const nodes=[...root.children],start=nodes[2].offsetTop+nodes[2].offsetHeight+32;
    const a=text(nodes[3],80,start),b=text(nodes[5],80+col+gap,start),imageY=start+Math.max(a,b)+28;
    bottom=imageY+Math.max(visual(nodes[4],80,imageY,1068.83),visual(nodes[6],80+col+gap,imageY,1073.4));
   }else{
    const group=q('2313:2854'),second=q('2321:2854');
    Object.assign(group.style,{display:'block',position:'absolute',height:'auto'});
    const sourceH=1528.0816,imgSource=q('2321:2857').querySelector('img');
    const rightRatio=(imgSource.naturalWidth||1920)/(imgSource.naturalHeight||1376),commonHeight=(1760-gap)/(1760/sourceH+rightRatio);
    const leftWidth=commonHeight*1760/sourceH,rightWidth=commonHeight*rightRatio;
    const start=q('2313:2856').offsetHeight+40;
    const a=text(q('2313:2857'),0,start),b=text(second, col+gap,start);
    Object.assign(second.style,{display:'block',height:'auto'});
    place(q('2313:2857'),0,start,leftWidth);place(second,leftWidth+gap,start,rightWidth);
    const sub=q('2321:2855'),desc=q('2321:2856');
    place(sub,0,0,rightWidth);sub.style.height='auto';place(desc,0,sub.offsetHeight+24,rightWidth);desc.style.height='auto';
    const firstDesc=q('2313:2858');place(firstDesc,0,start+q('2313:2857').offsetHeight+24,leftWidth);firstDesc.style.height='auto';
    const imageY=Math.max(firstDesc.offsetTop+firstDesc.offsetHeight,start+desc.offsetTop+desc.offsetHeight)+28;
    const leftVisual=q('2395:13606');visual(leftVisual,0,imageY,sourceH);leftVisual.style.transform=`scale(${leftWidth/1760})`;const h1=commonHeight;
    const pic=q('2321:2857');place(pic,0,imageY-start,rightWidth);pic.style.height='auto';pic.style.transform='none';
    const img=pic.querySelector('img');Object.assign(img.style,{position:'static',width:'100%',height:'auto',objectFit:'contain'});
    second.style.height=(imageY-start+img.offsetHeight)+'px';
    bottom=group.offsetTop+imageY+Math.max(h1,img.offsetHeight);
    group.style.height=(bottom-group.offsetTop)+'px';
   }
   root.style.height=(bottom+80)+'px';board.style.height=(bottom+80)+'px';shell.style.height=((bottom+80)*scale)+'px';
   shell.querySelectorAll('.surface-bleed').forEach(n=>n.remove());
  }
 }

 if(!isMobile){
  const shell=document.getElementById('board-14'),board=shell.querySelector(':scope>.board'),root=board.firstElementChild;
  const items=root.querySelector('[data-node-id="2395:2981"]'),review=shell.querySelector('.review-final');
  const height=items.offsetTop+items.offsetHeight+80,scale=board.getBoundingClientRect().width/1920;
  root.style.height=height+'px';board.style.height=height+'px';board.style.top='0px';
  review.style.top=height*scale+'px';
  shell.style.height=(height*scale+review.offsetHeight)+'px';
  shell.querySelectorAll('.surface-bleed').forEach(n=>n.remove());
 }


 // Match mobile title-to-intro spacing to the live business-flow reference.
 // Adjust only the intro's leading margin; its following gap remains untouched.
 if(isMobile){
  const find=(board,id)=>document.querySelector(`#${board} .mobile-copy[data-source-node="${id}"]`);
  const refTitle=find('board-6','2167:9813'),refIntro=find('board-6','2167:9815');
  refTitle.style.marginBottom=Math.max(0,30-(parseFloat(getComputedStyle(refTitle.parentElement).gap)||0))+'px';
  const gap=refIntro.getBoundingClientRect().top-refTitle.getBoundingClientRect().bottom;
  for(const n of document.querySelectorAll('#board-1.results-native h2,#board-8 .project-intro h2'))n.style.setProperty('margin-bottom',gap+'px','important');
  for(const [board,titleId,introId] of [['board-4','2382:2430','role-intro'],['board-5','2382:2163','2382:2156'],['board-9','2321:2845','2321:2846'],['board-11','2392:2845','2392:2846'],['board-12','2313:2844','2313:2845']]){
   const title=find(board,titleId),intro=find(board,introId);if(!title||!intro)continue;
   const current=intro.getBoundingClientRect().top-title.getBoundingClientRect().bottom;
   intro.style.marginTop=((parseFloat(getComputedStyle(intro).marginTop)||0)+gap-current)+'px';
  }
 }

 // Align ordinary chapter openings, leaving role composition and closing artwork intact.
 for(const id of ['board-4','board-5','board-6','board-9','board-11','board-12','board-13']){
  const shell=document.getElementById(id),board=shell.querySelector(':scope>.board');
  if(!isMobile){
   if(id==='board-4'||id==='board-6')continue;
   const title=board.querySelector('[data-reading-type="chapter"]');if(!title)continue;
   const delta=92-(title.getBoundingClientRect().top-shell.getBoundingClientRect().top);
   board.style.top=(parseFloat(board.style.top||0)+delta)+'px';
   shell.style.height=Math.max(innerHeight-menu.offsetHeight,parseFloat(shell.style.height)+delta)+'px';
   for(const bleed of shell.querySelectorAll(':scope>.surface-bleed'))bleed.style.top=(parseFloat(bleed.style.top)+delta)+'px';
  }else{
   const title=shell.querySelector('.mobile-section [data-reading-type="chapter"]');if(!title)continue;
   title.style.marginTop='0px';
   const delta=74-(title.getBoundingClientRect().top-shell.getBoundingClientRect().top);
   title.style.marginTop=delta+'px';
  }
 }

 // Full-bleed case tones follow actual content after every responsive layout pass.
 const caseShell=document.getElementById('board-11'),caseOrigin=caseShell.getBoundingClientRect().top;
 if(!isMobile){const canvas=caseShell.querySelector(':scope>.board'),scale=canvas.getBoundingClientRect().width/canvas.offsetWidth,group=canvas.querySelector('[data-node-id="2395:2843"]'),copy=canvas.querySelector('[data-node-id="2395:2884"]'),guide=canvas.querySelector('[data-node-id="2395:2839"]');copy.style.marginLeft=((guide.getBoundingClientRect().left-group.getBoundingClientRect().left)/scale)+'px';}

 const caseStarts=['2395:2825','2395:2850','2395:2851'].map(id=>{
   const node=caseShell.querySelector(isMobile?`[data-source-node="${id}"]`:`:scope>.board [data-node-id="${id}"]`);
   return Math.max(0,node.getBoundingClientRect().top-caseOrigin-24);
 });
 let caseSurfaces=[...caseShell.querySelectorAll(':scope>.case-group-surface')];
 if(!caseSurfaces.length){caseSurfaces=caseStarts.map(()=>{const layer=document.createElement('div');layer.className='case-group-surface';layer.setAttribute('aria-hidden','true');caseShell.prepend(layer);return layer;});}
 caseSurfaces.sort((a,b)=>Number(a.dataset.caseIndex)-Number(b.dataset.caseIndex));
 const valueIds=['2395:2845','2392:2876','2395:2808'];
 const textEnds=valueIds.map(id=>{const p=caseShell.querySelector(isMobile?`[data-source-node="${id}"]`:`:scope>.board [data-node-id="${id}"]`),range=document.createRange();range.selectNodeContents(p.querySelector('.case-tradeoff'));return range.getBoundingClientRect().bottom-caseOrigin;});
 // Mobile retains the existing illustrations after the text; all three use the same text-to-edge distance.
 let caseBottomInset=32;
 if(isMobile){caseBottomInset=Math.ceil(Math.max(...['2395:2825','2395:2850','2395:2851'].map((id,i)=>caseShell.querySelector(`[data-source-node="${id}"]`).nextElementSibling.getBoundingClientRect().bottom-caseOrigin-textEnds[i])));}
 caseSurfaces.forEach((layer,i)=>{layer.dataset.caseIndex=i;layer.style.top=caseStarts[i]+'px';layer.style.height=Math.max(0,textEnds[i]+caseBottomInset-caseStarts[i])+'px';});
 caseShell.style.backgroundImage='none';
 if(navigationDock&&location.hash==='#'+navigationDock.id)scrollTo({top:Math.max(0,navigationDock.getBoundingClientRect().top+scrollY-menu.offsetHeight),behavior:'instant'});
};
const scheduleResize=()=>requestAnimationFrame(resize);
addEventListener('resize',scheduleResize);document.addEventListener('fullscreenchange',scheduleResize);document.fonts?.ready.then(scheduleResize);resize();scheduleResize();
const links=[...document.querySelectorAll('.chapter-links a')];let pending=false;
const mark=()=>{pending=false;const line=document.querySelector('.topbar').getBoundingClientRect().bottom+20;let active=null;for(const l of links)if(document.querySelector(l.hash).getBoundingClientRect().top<=line)active=l;if(innerHeight+scrollY>=document.documentElement.scrollHeight-2)active=links[links.length-1];for(const l of links){if(l===active)l.setAttribute('aria-current','location');else l.removeAttribute('aria-current');}};
for(const link of links)link.addEventListener('click',event=>{event.preventDefault();const target=document.querySelector(link.hash);navigationDock=target;history.pushState(null,'',link.hash);const go=()=>{if(navigationDock!==target||location.hash!==link.hash)return;scrollTo({top:Math.max(0,target.getBoundingClientRect().top+scrollY-document.querySelector('.topbar').getBoundingClientRect().height),behavior:'instant'});mark();};go();requestAnimationFrame(()=>requestAnimationFrame(go));});
const initialHash=()=>{const target=location.hash&&document.getElementById(location.hash.slice(1));if(target){navigationDock=target;scrollTo({top:Math.max(0,target.getBoundingClientRect().top+scrollY-document.querySelector('.topbar').getBoundingClientRect().height),behavior:'instant'});}};addEventListener('load',initialHash);addEventListener('pageshow',()=>requestAnimationFrame(initialHash));document.fonts?.ready.then(initialHash);
addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(mark);}},{passive:true});mark();
})();
