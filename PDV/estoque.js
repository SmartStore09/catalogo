'use strict';
/* ================= ESTOQUE LOCAL ================= */
function estoqueDe(p){
  const m=ls(LS_ESTQ)||{};
  return (m[p.c]!==undefined) ? m[p.c] : p.estq;   // null = não controlado
}
function setEstoque(code,qtd){
  const m=ls(LS_ESTQ)||{}; m[code]=qtd; lsSet(LS_ESTQ,m); renderLista();
  const prod=CATALOGO.find(x=>x.c===code);
  if(prod) sincronizarEstoqueManual(prod, qtd); // reflete na planilha em segundo plano, se estiver conectado
}
function ajustarEstoque(ev,code){
  ev.stopPropagation();
  const p=CATALOGO.find(x=>x.c===code); if(!p) return;
  const atual=estoqueDe(p);
  const v=prompt(`Estoque de "${p.n}"\n(vazio = não controlar)`, atual==null?'':atual);
  if(v===null) return;
  if(v.trim()===''){ const m=ls(LS_ESTQ)||{}; delete m[code]; lsSet(LS_ESTQ,m); renderLista(); }
  else setEstoque(code, Math.max(0,parseInt(v,10)||0));
}
