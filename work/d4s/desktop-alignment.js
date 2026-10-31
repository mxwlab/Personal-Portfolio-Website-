/* Normalize only outer content anchors; nested UI indents are untouched. */
(()=>{
 const hiddenBoards=[...document.querySelectorAll('.board-shell>.board')].filter(b=>getComputedStyle(b).display==='none').map(b=>({b,display:b.style.display,visibility:b.style.visibility,position:b.style.position}));
 for(const {b} of hiddenBoards){b.style.display='block';b.style.visibility='hidden';b.style.position='absolute';}

 for(const shell of document.querySelectorAll('.board-shell')){
  const board=shell.querySelector(':scope>.board'),root=board.firstElementChild;
  for(const node of [...root.children]){
   const style=getComputedStyle(node),left=parseFloat(style.left),width=node.getBoundingClientRect().width;
   if(!Number.isFinite(left)||width>=1870||left>190||left<0)continue;
   if(shell.id==='board-0'&&node.dataset.nodeId==='2383:2650')continue;
   node.style.left='80px';node.dataset.gutterAligned='left';
   if(width>=1400&&width<=1760&&style.transform==='none'){
    const visual=node.querySelector('img')||[...node.children].some(c=>!['rgba(0, 0, 0, 0)','transparent'].includes(getComputedStyle(c).backgroundColor));
    if(!visual){node.style.width='1760px';continue;}
    const factor=1760/width;
    node.style.transform=`scale(${factor})`;node.style.transformOrigin='top left';node.dataset.gutterAligned='both';
   }
  }
 }
 for(const {b,display,visibility,position} of hiddenBoards){b.style.display=display;b.style.visibility=visibility;b.style.position=position;}
})();
