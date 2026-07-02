'use strict';
/* ================= CARRINHO ================= */
function addCarrinho(code){
  const p=CATALOGO.find(x=>x.c===code); if(!p) return;
  let manual=null;
  if(p.p==null){
    const v=prompt(`"${p.n}" é sob consulta.\nDigite o preço combinado (R$):`);
    if(v===null) return;
    manual=brl(v) ?? parseFloat(v.replace(',','.'));
    if(manual==null||isNaN(manual)){alert('Preço inválido.');return;}
  }
  const eq=estoqueDe(p);
  const it=carrinho.find(i=>i.prod.c===code && i.manual===manual);
  const qAtual=it?it.q:0;
  if(eq!==null && qAtual+1>eq){ alert(`Estoque insuficiente (${eq} disponível).`); return; }
  if(it) it.q++; else carrinho.push({prod:p,q:1,manual});
  render();
  // On mobile: auto-switch to cart view when first item added
  if(window.innerWidth<=768 && carrinho.length===1 && !it) mobTab('cart');
}
function mudaQ(i,d){
  const it=carrinho[i];
  if(d>0){ const eq=estoqueDe(it.prod); if(eq!==null&&it.q+1>eq){alert(`Estoque: só ${eq} unid.`);return;} }
  it.q+=d; if(it.q<=0) carrinho.splice(i,1); render();
}
function tira(i){carrinho.splice(i,1);render();}

const pixFator=()=>{ const v=parseFloat(document.getElementById('pix-pct').value); return (isNaN(v)||v<=0)?0:Math.max(0,Math.min(100,v))/100; };
const unitario=(it)=>{
  const preco = it.manual!=null ? it.manual : (it.prod.p||0);
  if(forma==='PIX'){ const pf=pixFator(); return pf>0 ? r2(preco*(1-pf)) : preco; }
  return preco;
};
const unitNormal=(it)=> it.manual!=null?it.manual:(it.prod.p||0);

function totais(){
  const sub=r2(carrinho.reduce((s,it)=>s+unitNormal(it)*it.q,0));
  const tot0=r2(carrinho.reduce((s,it)=>s+unitario(it)*it.q,0));
  const descPix=r2(sub-tot0);
  const dx=parseFloat(document.getElementById('descx').value)||0;
  const total=Math.max(0,r2(tot0-dx));
  let custo=0,semCusto=0;
  carrinho.forEach(it=>{ if(it.prod.custo!=null)custo+=it.prod.custo*it.q; else semCusto++; });
  return {sub,descPix,dx,total,custo:r2(custo),semCusto,lucro:r2(total-custo)};
}
