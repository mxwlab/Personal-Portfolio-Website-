(()=>{
 const diagram=document.querySelector('#board-8 .project-diagram'),canvas=diagram.firstElementChild;
 const layout=()=>{const scale=diagram.clientWidth/1744.24;canvas.style.transform=`scale(${scale})`;canvas.style.left=(-109.88*scale)+'px';canvas.style.top=(-4099.68*scale)+'px';window.layoutD4SReadingType?.();};
 new ResizeObserver(layout).observe(diagram);layout();
})();
