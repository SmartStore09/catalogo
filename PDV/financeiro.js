'use strict';
/* ================= FINANCEIRO (controle familiar Jânio/Iza) ================= */
const FIN_KEY  = 'ss09_financas';
const FIN_CATS = [
  {id:'mercado',  label:'Mercado',    icon:'🛒', color:'#22c55e'},
  {id:'acougue',  label:'Açougue',    icon:'🥩', color:'#ef4444'},
  {id:'frutaria', label:'Frutaria',   icon:'🍎', color:'#f97316'},
  {id:'aluguel',  label:'Aluguel',    icon:'🏠', color:'#6366f1'},
  {id:'lanche',   label:'Lanche',     icon:'🍔', color:'#eab308'},
  {id:'farmacia', label:'Farmácia',   icon:'💊', color:'#06b6d4'},
  {id:'combustivel',label:'Combustível',icon:'⛽',color:'#8b5cf6'},
  {id:'pessoal',  label:'Pessoal',    icon:'👗', color:'#ec4899'},
  {id:'escola',   label:'Escola',     icon:'📚', color:'#3b82f6'},
  {id:'parcela',  label:'Parcela',    icon:'💳', color:'#f43f5e'},
  {id:'outros',   label:'Outros',     icon:'📦', color:'#6b7280'},
  {id:'loja',     label:'Retirada Loja',icon:'🏪',color:'#f59e0b',isLoja:true},
];
let finWho = localStorage.getItem('ss09_fin_who') || 'j';
let finCatSel = null;
let finTab = 'lancar';

const finLoad = () => { try{return JSON.parse(localStorage.getItem(FIN_KEY)||'[]')}catch(e){return[]} };
const finSave = d => localStorage.setItem(FIN_KEY, JSON.stringify(d));
const finFmt  = n => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const finToday = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const finMonth = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); };
const finCatInfo = id => FIN_CATS.find(c=>c.id===id)||{label:id,icon:'📦',color:'#6b7280'};
const finFmtTs = ts => { const d=new Date(ts); return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); };

function abrirFinanceiro(){
  finBuildCatGrid();
  finSetWho(finWho);
  finGoTab('lancar');
  document.getElementById('fin-amt').value='';
  document.getElementById('fin-desc').value='';
  finCatSel=null;
  document.querySelectorAll('.cat-f').forEach(b=>b.classList.remove('sel'));
  document.getElementById('fin-save').disabled=true;
  abrir('m-fin');
}

function finBuildCatGrid(){
  const el=document.getElementById('fin-cat-grid');
  el.innerHTML=FIN_CATS.map(c=>`<button class="cat-f${c.isLoja?' loja-f':''}" id="fcopt-${c.id}" onclick="finSelCat('${c.id}')">
    <span class="cat-f-icon">${c.icon}</span>
    <span class="cat-f-label">${c.label}</span>
  </button>`).join('');
}

function finSelCat(id){
  finCatSel=id;
  document.querySelectorAll('.cat-f').forEach(b=>b.classList.remove('sel'));
  document.getElementById('fcopt-'+id).classList.add('sel');
  document.getElementById('fin-save').disabled=!document.getElementById('fin-amt').value;
  document.getElementById('fin-amt').focus();
}

document.addEventListener('DOMContentLoaded',()=>{
  const amtInp=document.getElementById('fin-amt');
  if(amtInp) amtInp.addEventListener('input',()=>{
    document.getElementById('fin-save').disabled=!amtInp.value||!finCatSel;
  });
});

function finSetWho(who){
  finWho=who;
  localStorage.setItem('ss09_fin_who',who);
  document.getElementById('fin-who-j').className='fin-who-btn j'+(who==='j'?' sel':'');
  document.getElementById('fin-who-iz').className='fin-who-btn iz'+(who==='iz'?' sel':'');
}

function finGoTab(t){
  finTab=t;
  document.querySelectorAll('.fin-tab').forEach(x=>x.classList.remove('sel'));
  document.querySelectorAll('.fin-scr').forEach(x=>x.classList.remove('on'));
  document.getElementById('fintab-'+t).classList.add('sel');
  document.getElementById('finscr-'+t).classList.add('on');
  if(t==='sync'){ const m=document.getElementById('fin-sync-msg'); if(m) m.textContent=''; }
  if(t==='hoje') finRenderHoje();
  else if(t==='hist') finRenderHist();
  else if(t==='mes') finRenderMes();
  else if(t==='loja') finRenderLoja();
}

function finSalvar(){
  if(!finCatSel){alert('Selecione uma categoria');return;}
  const amt=parseFloat(document.getElementById('fin-amt').value);
  if(!amt||amt<=0){alert('Valor inválido');return;}
  const entry={id:Date.now(),who:finWho,cat:finCatSel,amount:amt,desc:document.getElementById('fin-desc').value.trim(),date:finToday()};
  const d=finLoad(); d.push(entry); finSave(d);
  document.getElementById('fin-amt').value='';
  document.getElementById('fin-desc').value='';
  finCatSel=null;
  document.querySelectorAll('.cat-f').forEach(b=>b.classList.remove('sel'));
  document.getElementById('fin-save').disabled=true;
  finGoTab('hoje');
}

function finDelEntry(id){
  finSave(finLoad().filter(e=>e.id!==id));
  finGoTab(finTab);
}

function finEntryHTML(e,showDate=false){
  const c=finCatInfo(e.cat);
  return `<div class="fin-entry">
    <span style="font-size:1.2rem">${c.icon}</span>
    <div class="fe-body">
      <div class="fe-cat">${c.label}${e.desc?' <span style="font-weight:500;color:var(--mut)">· '+esc(e.desc)+'</span>':''}</div>
      <div class="fe-meta"><span class="fin-who-dot ${e.who}"></span>${showDate?finFmtTs(e.id)+' · ':''}${e.who==='j'?'Jânio':'Iza'}</div>
    </div>
    <span class="fe-amt" style="color:${e.cat==='loja'?'#fbbf24':'var(--txt)'}">${finFmt(e.amount)}</span>
    <button class="fin-del-btn" onclick="finDelEntry(${e.id})">🗑</button>
  </div>`;
}

function finRenderHoje(){
  const all=finLoad(), today=finToday();
  const ent=all.filter(e=>e.date===today);
  const tot=ent.reduce((s,e)=>s+e.amount,0);
  const jt=ent.filter(e=>e.who==='j').reduce((s,e)=>s+e.amount,0);
  const it=ent.filter(e=>e.who==='iz').reduce((s,e)=>s+e.amount,0);
  document.getElementById('fh-total').textContent=finFmt(tot);
  document.getElementById('fh-janio').textContent=finFmt(jt);
  document.getElementById('fh-iza').textContent=finFmt(it);
  // loja alert
  const lojaM=all.filter(e=>e.date.startsWith(finMonth())&&e.cat==='loja');
  const lojaT=lojaM.reduce((s,e)=>s+e.amount,0);
  const la=document.getElementById('fh-loja-alert');
  la.innerHTML=lojaT>0?`<div class="fin-loja-alert"><small>🏪 RETIRADAS DA LOJA ESTE MÊS</small><b>${finFmt(lojaT)}</b></div>`:'';
  // cats
  const byCat={};
  ent.forEach(e=>{byCat[e.cat]=(byCat[e.cat]||0)+e.amount;});
  const maxC=Math.max(...Object.values(byCat),1);
  const cEl=document.getElementById('fh-cats');
  cEl.innerHTML=Object.keys(byCat).length?Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([id,val])=>{
    const c=finCatInfo(id),pct=Math.round(val/maxC*100);
    return `<div class="fin-cat-row"><span style="font-size:1.15rem">${c.icon}</span>
      <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between"><span style="font-size:13px;font-weight:600">${c.label}</span><span style="font-size:13px;font-weight:700;color:${c.color}">${finFmt(val)}</span></div>
      <div class="fin-cat-bar-wrap"><div class="fin-cat-bar" style="width:${pct}%;background:${c.color}"></div></div></div></div>`;
  }).join(''):`<div class="fin-empty">Nenhum gasto hoje</div>`;
  // entries
  const eEl=document.getElementById('fh-entries');
  eEl.innerHTML=ent.length?[...ent].reverse().map(e=>finEntryHTML(e)).join(''):`<div class="fin-empty">Toque em ➕ Lançar para registrar</div>`;
}

function finRenderHist(){
  const all=finLoad().slice(-60).reverse();
  const el=document.getElementById('fin-hist-list');
  el.innerHTML=all.length?all.map(e=>finEntryHTML(e,true)).join(''):`<div class="fin-empty">Nenhum lançamento ainda</div>`;
}

function finRenderMes(){
  const m=finMonth();
  const all=finLoad().filter(e=>e.date.startsWith(m));
  const tot=all.reduce((s,e)=>s+e.amount,0);
  const lojaT=all.filter(e=>e.cat==='loja').reduce((s,e)=>s+e.amount,0);
  document.getElementById('fm-label').textContent=new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).toUpperCase();
  document.getElementById('fm-total').textContent=finFmt(tot);
  document.getElementById('fm-loja').textContent=finFmt(lojaT);
  const byCat={};
  all.forEach(e=>{if(!byCat[e.cat])byCat[e.cat]={total:0,j:0,iz:0};byCat[e.cat].total+=e.amount;byCat[e.cat][e.who]+=e.amount;});
  const maxC=Math.max(...Object.values(byCat).map(v=>v.total),1);
  const el=document.getElementById('fm-cats');
  el.innerHTML=Object.keys(byCat).length?Object.entries(byCat).sort((a,b)=>b[1].total-a[1].total).map(([id,v])=>{
    const c=finCatInfo(id),pct=Math.round(v.total/maxC*100);
    return `<div class="fin-mes-card"><div class="fin-mes-top"><span style="font-size:1.1rem">${c.icon}</span><span style="flex:1;font-size:13px;font-weight:600">${c.label}</span><span style="font-size:13.5px;font-weight:800;color:${c.color}">${finFmt(v.total)}</span></div>
      <div class="fin-cat-bar-wrap" style="margin-bottom:5px"><div class="fin-cat-bar" style="width:${pct}%;background:${c.color}"></div></div>
      <div style="display:flex;gap:4px">${v.j>0?`<span class="fin-chip j">Jânio ${finFmt(v.j)}</span>`:''}${v.iz>0?`<span class="fin-chip iz">Iza ${finFmt(v.iz)}</span>`:''}</div></div>`;
  }).join(''):`<div class="fin-empty">Nenhum gasto este mês</div>`;
}

function finRenderLoja(){
  const m=finMonth();
  const all=finLoad().filter(e=>e.cat==='loja'&&e.date.startsWith(m));
  const tot=all.reduce((s,e)=>s+e.amount,0);
  const jt=all.filter(e=>e.who==='j').reduce((s,e)=>s+e.amount,0);
  const it=all.filter(e=>e.who==='iz').reduce((s,e)=>s+e.amount,0);
  document.getElementById('fl-total').textContent=finFmt(tot);
  document.getElementById('fl-j').textContent=finFmt(jt);
  document.getElementById('fl-iz').textContent=finFmt(it);
  const el=document.getElementById('fl-entries');
  el.innerHTML=all.length?[...all].reverse().map(e=>finEntryHTML(e,true)).join(''):`<div class="fin-empty">Nenhuma retirada este mês</div>`;
}
