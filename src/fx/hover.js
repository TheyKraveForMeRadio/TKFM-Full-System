
export function attachNeonHover(){ document.addEventListener('mouseover', (e)=>{ const t = e.target; if(t.classList && t.classList.contains('neon-btn')){ t.style.boxShadow = '0 10px 40px rgba(211,124,255,0.28)'; } }); document.addEventListener('mouseout',(e)=>{ const t=e.target; if(t.classList && t.classList.contains('neon-btn')){ t.style.boxShadow='none'; } }); }
