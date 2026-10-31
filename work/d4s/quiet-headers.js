/* Auxiliary Portfolio rail only; layout and source content remain unchanged. */
(()=>{
 const entries=[];
 const headers={1:['01/使用效率','dark'],3:['02/背景挑战','dark'],4:['03/用户画像','dark'],5:['04/ 范围层与结构层','light'],6:['05/ 业务流程','light'],7:['06/ 业财旅程','light'],8:['07/项目管理','dark'],9:['08/ 配置与财务','light'],10:['09/任务与交付','dark'],11:['10/方案探索','dark'],12:['11/ 会议反馈','light'],13:['12/ 文件与验收','light'],14:['13/交付复盘','dark']};
 const labelFor=board=>[...board.querySelectorAll('p')].find(p=>/^\s*\d{2}\s*[/／]/.test(p.textContent)||p.textContent.trim()==='上线前后 / 实际使用成效');
 const rail=(label,tone)=>{const row=document.createElement('header');row.className='quiet-portfolio-rail';row.dataset.tone=tone;const page=document.createElement('span');const ordinal=document.createElement("span");ordinal.className="d4s-display-number";ordinal.textContent=label.slice(0,2);page.append(ordinal,document.createTextNode(label.slice(2)));const name=document.createElement('span');name.className='portfolio-wordmark';name.textContent='- Portfolio';const line=document.createElement('img');line.className='portfolio-wave';line.alt='';line.setAttribute('aria-hidden','true');line.src=tone==='light'?'figma-assets/header-rule-light.svg':'figma-assets/results-rule.svg';row.append(page,name,line);return row;};
 const suppress=p=>{p.style.visibility='hidden';p.setAttribute('aria-hidden','true');let n=p.parentElement;for(let i=0;i<3&&n&&!n.classList.contains('board');i++,n=n.parentElement){if(n.querySelectorAll('p,ol,ul').length!==1)break;n.style.visibility='hidden';n.setAttribute('aria-hidden','true');}};
 for(const shell of document.querySelectorAll('.board-shell')){
  const board=shell.querySelector(':scope>.board'),p=[...board.querySelectorAll('p')].find(p=>p.textContent.trim()==='Portfolio');if(!p)continue;
  const label=labelFor(board);if(!label)continue;
  const spec=headers[Number(shell.id.split('-')[1])];
  const row=rail(spec?.[0]||'',spec?.[1]||'dark');if(!spec)row.hidden=true;row.classList.add('desktop-portfolio-rail');shell.append(row);
  suppress(p);suppress(label);entries.push({shell,board,p,row});
  const mobile=shell.querySelector('.mobile-section'),mp=mobile.querySelector(`[data-source-node="${p.dataset.nodeId}"]`),ml=mobile.querySelector(`[data-source-node="${label.dataset.nodeId}"]`);
  if(mp&&ml){
   const band=mp.closest('.mobile-band');let insertion=mp;while(insertion.parentElement!==band)insertion=insertion.parentElement;
   const mr=rail(spec?.[0]||'',spec?.[1]||'dark');if(!spec)mr.hidden=true;mr.classList.add('mobile-portfolio-rail');band.insertBefore(mr,insertion);
   for(const old of [mp,ml]){old.style.display='none';old.setAttribute('aria-hidden','true');let n=old.parentElement;while(n!==band&&n.classList.contains('mobile-flow')&&[...n.children].every(c=>getComputedStyle(c).display==='none')){n.style.display='none';n=n.parentElement;}}
   entries[entries.length-1].mobile=mr;entries[entries.length-1].band=band;
  }
 }
 // One auxiliary style contract for source-positioned and flowing screens.
 const nativeSpecs=[['#board-1','.results-eyebrow','.results-rule'],['#board-7','.journey-header','.journey-wave'],['#board-8','.project-header','.project-wave'],['#board-10','.task-header','.task-wave']];
 for(const [id,selector,wave] of nativeSpecs){const shell=document.querySelector(id),header=shell.querySelector(selector);header.classList.add('compact-native-header');header.dataset.tone=headers[Number(id.split('-')[1])][1];header.lastElementChild.classList.add('compact-wordmark');shell.querySelector(wave).classList.add('compact-wave');}
 const background=document.querySelector('#board-3');background.querySelector('.background-source-header').style.visibility='hidden';background.querySelector('.background-source-wave').style.visibility='hidden';
 window.compactD4SHeaders=()=>{
  if(innerWidth<=600)return;
  for(const e of entries){
   if(e.shell.matches('.results-native,.journey-native,.project-native,.task-native'))continue;
   const sr=e.shell.getBoundingClientRect(),pr=e.p.getBoundingClientRect();
   // Remove only surplus header space; translate the entire source body equally.
   const delta=Math.max(0,pr.bottom-sr.top+30-76);
   e.board.style.top=(parseFloat(e.board.style.top||0)-delta)+'px';
   e.shell.style.height=(parseFloat(e.shell.style.height)-delta)+'px';
   for(const bleed of e.shell.querySelectorAll(':scope>.surface-bleed'))bleed.style.top=(parseFloat(bleed.style.top)-delta)+'px';
   e.row.style.top='20px';
  }
 };
 dispatchEvent(new Event('resize'));
})();
