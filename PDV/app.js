'use strict';
/* ================= LISTA DE PRODUTOS ================= */
function renderChips(){
  const cats=['Todas',...new Set(CATALOGO.map(p=>p.cat))];
  document.getElementById('chips').innerHTML=cats.map(c=>
    `<button class="chip${c===catSel?' sel':''}" onclick="catSel='${esc(c)}';renderChips();renderLista()">${EMOJI[c]||''} ${esc(c)}</button>`).join('');
}
function filtrados(){
  const q=document.getElementById('busca').value.trim().toLowerCase();
  return CATALOGO.filter(p=>{
    if(catSel!=='Todas'&&p.cat!==catSel) return false;
    if(!q) return true;
    return (p.n+' '+p.c+' '+p.m+' '+p.e).toLowerCase().includes(q);
  });
}
function renderLista(){
  const fs=filtrados();
  document.getElementById('lista').innerHTML = fs.slice(0,200).map(p=>{
    const eq=estoqueDe(p);
    let tags='';
    if(p.st==='Último') tags+='<span class="tag ult">ÚLTIMO</span>';
    if(p.p==null) tags+='<span class="tag cons">CONSULTAR</span>';
    if(eq!==null) tags+=`<span class="tag ${eq<=0?'zero':'estq'}" onclick="ajustarEstoque(event,'${esc(p.c)}')" title="Clique para ajustar estoque">estq: ${eq}</span>`;
    return `<div class="prod" onclick="addCarrinho('${esc(p.c)}')">
      <div class="info">
        <div class="nome">${esc(p.n)}</div>
        <div class="det">${esc(p.c)} · ${esc(p.e||p.m)}${p.obs?' · '+esc(p.obs):''}</div>
      </div>${tags}
      <div class="precos"><div class="pv">${fmt(p.p)}</div><div class="ppix">${p.pix!=null?'PIX '+fmt(p.pix):''}</div></div>
    </div>`;
  }).join('') || '<div id="vazio">Nenhum produto encontrado.</div>';
}

/* ================= MODAIS / ATALHOS ================= */
const abrir = id => document.getElementById(id).classList.add('aberto');
const fechar = id => document.getElementById(id).classList.remove('aberto');
document.addEventListener('keydown',e=>{
  if(e.key==='/' && document.activeElement.tagName!=='INPUT'){e.preventDefault();document.getElementById('busca').focus();}
  if(e.key==='F2'){e.preventDefault();if(!document.getElementById('fim').disabled)finalizar();}
  if(e.key==='Escape')document.querySelectorAll('.modal.aberto').forEach(m=>m.classList.remove('aberto'));
});
document.getElementById('busca').addEventListener('input',renderLista);
document.getElementById('busca').addEventListener('keydown',e=>{
  if(e.key==='Enter'){const f=filtrados();if(f.length===1)addCarrinho(f[0].c);}
});
setInterval(()=>{document.getElementById('clock').textContent=new Date().toLocaleString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});},1000);

/* ================= PIN ================= */
const PDV_PIN = '0909';
let pinBuf = '';
function pk(d){
  if(d===''){pinBuf=pinBuf.slice(0,-1);}
  else{ if(pinBuf.length>=4) return; pinBuf+=d; if(pinBuf.length===4) setTimeout(checkPIN,120); }
  updDots();
}
function updDots(){for(let i=0;i<4;i++) document.getElementById('pd'+i).classList.toggle('on',i<pinBuf.length);}
function checkPIN(){
  if(pinBuf===PDV_PIN){
    sessionStorage.setItem('pdv_ok','1');
    document.getElementById('pin-ov').style.display='none';
    init();
  } else {
    const e=document.getElementById('pin-err'); e.textContent='PIN incorreto';
    pinBuf=''; updDots(); setTimeout(()=>e.textContent='',1500);
  }
}

/* ================= MOBILE NAV ================= */
let mobView = 'prod';
function mobTab(v){
  mobView=v;
  document.querySelectorAll('.mob-tab').forEach(t=>t.classList.remove('sel'));
  document.getElementById('mtab-'+v).classList.add('sel');
  if(v==='prod'){
    document.getElementById('left').classList.remove('hidden-mob');
    document.getElementById('right').classList.add('hidden-mob');
  } else if(v==='cart'){
    document.getElementById('left').classList.add('hidden-mob');
    document.getElementById('right').classList.remove('hidden-mob');
  } else if(v==='fin'){
    document.getElementById('left').classList.add('hidden-mob');
    document.getElementById('right').classList.add('hidden-mob');
    abrirFinanceiro();
  }
}
function updCartBadge(){
  const n=carrinho.reduce((s,i)=>s+i.q,0);
  const b=document.getElementById('cart-badge');
  if(b){b.style.display=n?'':'none';b.textContent=n;}
}

/* ================= INICIA ================= */
function init(){
  setForma('PIX');
  render();
  carregarTudo(false);
  atualizarBadgeConexao();
  atualizarBadgeFila();
  sincronizarPendentes();
}
// Skip PIN if session already unlocked (roda depois que todo o HTML/scripts carregaram)
if(sessionStorage.getItem('pdv_ok')){
  document.getElementById('pin-ov').style.display='none';
  init();
}

/* ================= PWA: Service Worker ================= */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{/* PWA é opcional; app funciona sem SW */});
  });
}
