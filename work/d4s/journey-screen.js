/* Scale only the original multi-image research collage; all journey copy is native HTML. */
(()=>{const host=document.querySelector('#board-7 .journey-photo');if(!host)return;const fit=()=>{host.firstElementChild.style.transform=`scale(${host.clientWidth/1633})`;};new ResizeObserver(fit).observe(host);fit();})();
