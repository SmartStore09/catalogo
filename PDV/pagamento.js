'use strict';
/* ================= FORMA DE PAGAMENTO / TOTAIS ================= */
function setForma(f){
  forma=f;
  document.querySelectorAll('.fp').forEach(b=>b.classList.toggle('sel',b.dataset.f===f));
  document.getElementById('ex-din').style.display = f==='DINHEIRO'?'flex':'none';
  document.getElementById('ex-car').style.display = f==='CARTAO'?'flex':'none';
  const ep=document.getElementById('ex-pix'); if(ep) ep.style.display=f==='PIX'?'flex':'none';
  render();
}
function toggleLucro(){ mostrarLucro=!mostrarLucro; render(); }

function render(){
  const cart=document.getElementById('cart');
  if(!carrinho.length) cart.innerHTML='<div id="vazio">Carrinho vazio.<br>Clique num produto para adicionar.</div>';
  else cart.innerHTML=carrinho.map((it,i)=>`<div class="cit">
      <div class="cn"><b>${esc(it.prod.n)}</b><small>${esc(it.prod.c)} · ${fmt(unitario(it))}/un</small></div>
      <button class="qbtn" onclick="mudaQ(${i},-1)">−</button><span class="qt">${it.q}</span>
      <button class="qbtn" onclick="mudaQ(${i},1)">+</button>
      <span class="tot">${fmt(r2(unitario(it)*it.q))}</span>
      <button class="xbtn" onclick="tira(${i})">✕</button>
    </div>`).join('');
  const t=totais();
  document.getElementById('sub').textContent=fmt(t.sub);
  const dpixEl=document.getElementById('dpix');
  const ldpix=document.getElementById('lin-dpix');
  if(forma==='PIX'&&t.descPix>0){dpixEl.textContent='− '+fmt(t.descPix);if(ldpix)ldpix.style.display='flex';}
  else{dpixEl.textContent='—';if(ldpix)ldpix.style.display='none';}
  document.getElementById('total').textContent=fmt(t.total);
  const ll=document.getElementById('llucro');
  ll.style.display=mostrarLucro?'flex':'none';
  if(mostrarLucro) document.getElementById('lucro').textContent=fmt(t.lucro)+(t.semCusto?` (~${t.semCusto} item s/ custo)`:'');
  // dinheiro
  if(forma==='DINHEIRO'){
    const rec=parseFloat(document.getElementById('recebido').value)||0;
    document.getElementById('troco').textContent='Troco: '+(rec>=t.total&&t.total>0?fmt(r2(rec-t.total)):'—');
  }
  // cartão
  if(forma==='CARTAO'){
    const sel=document.getElementById('parcelas');
    if(!sel.options.length){
      sel.innerHTML='<option value="0">Débito</option>'+Array.from({length:12},(_,k)=>`<option value="${k+1}">${k+1}x crédito</option>`).join('');
    }
    const n=parseInt(sel.value,10);
    document.getElementById('vparc').textContent = n>0&&t.total>0 ? `${n}x de ${fmt(r2(t.total/n))}` : '—';
  }
  document.getElementById('fim').disabled = !carrinho.length || t.total<0;
  updCartBadge();
}

/* ================= FINALIZAR / RECIBO ================= */
function finalizar(){
  if(!carrinho.length) return;
  const t=totais();
  if(forma==='DINHEIRO'){
    const rec=parseFloat(document.getElementById('recebido').value)||0;
    if(rec<t.total&&!confirm('Valor recebido menor que o total. Registrar mesmo assim?')) return;
  }
  const vendas=ls(LS_VENDAS)||[];
  const agora=new Date();
  const parc = forma==='CARTAO'?parseInt(document.getElementById('parcelas').value,10):0;
  const rec = forma==='DINHEIRO'?(parseFloat(document.getElementById('recebido').value)||0):0;
  const venda={
    n:(vendas.length?vendas[vendas.length-1].n+1:1),
    ts:agora.getTime(),
    dia:agora.toLocaleDateString('sv-SE'),  // YYYY-MM-DD local
    itens:carrinho.map(it=>({c:it.prod.c,n:it.prod.n,q:it.q,un:unitario(it),custo:it.prod.custo})),
    pag:forma, parcelas:parc,
    recebido:rec, troco: rec>t.total?r2(rec-t.total):0,
    sub:t.sub, descPix:(forma==='PIX'?t.descPix:0), descExtra:t.dx,
    total:t.total, custo:t.custo, lucro:t.lucro
  };
  vendas.push(venda); lsSet(LS_VENDAS,vendas);
  // baixa de estoque
  carrinho.forEach(it=>{
    const eq=estoqueDe(it.prod);
    if(eq!==null) setEstoque(it.prod.c, Math.max(0,eq-it.q));
  });
  sincronizarVenda(venda); // grava na planilha em segundo plano (ou enfileira se estiver offline)
  ultimaVenda=venda;
  document.getElementById('recibo-txt').textContent=textoRecibo(venda);
  document.getElementById('zap').value=ls(LS_ZAP)||'';
  abrir('m-recibo');
  carrinho=[]; document.getElementById('descx').value=''; document.getElementById('recebido').value='';
  render();
}
function textoRecibo(v){
  const d=new Date(v.ts);
  let s=`🏪 *${LOJA.nome}*\n${LOJA.cidade} · ${LOJA.fone}\n`;
  s+=`────────────────────────\n*COMPROVANTE Nº ${String(v.n).padStart(4,'0')}*\n`;
  s+=`${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}\n────────────────────────\n`;
  v.itens.forEach(it=>{ s+=`${it.q}x ${it.n}\n   ${fmt(it.un)} un → ${fmt(r2(it.un*it.q))}\n`; });
  s+=`────────────────────────\n`;
  if(v.descPix>0) s+=`Desconto PIX: −${fmt(v.descPix)}\n`;
  if(v.descExtra>0) s+=`Desconto: −${fmt(v.descExtra)}\n`;
  s+=`*TOTAL: ${fmt(v.total)}*\n`;
  s+=`Pagamento: ${v.pag==='CARTAO'?(v.parcelas>0?`Cartão crédito ${v.parcelas}x de ${fmt(r2(v.total/v.parcelas))}`:'Cartão débito'):v.pag==='PIX'?'PIX':'Dinheiro'}\n`;
  if(v.pag==='DINHEIRO'&&v.recebido) s+=`Recebido: ${fmt(v.recebido)} · Troco: ${fmt(v.troco)}\n`;
  s+=`────────────────────────\nObrigado pela preferência! 🙌\n${LOJA.site}`;
  return s;
}
function enviarZap(){
  const tel=document.getElementById('zap').value.replace(/\D/g,'');
  if(tel) lsSet(LS_ZAP,document.getElementById('zap').value);
  const txt=encodeURIComponent(document.getElementById('recibo-txt').textContent);
  window.open(tel?`https://wa.me/55${tel}?text=${txt}`:`https://wa.me/?text=${txt}`,'_blank');
}
function copiarRecibo(){
  navigator.clipboard.writeText(document.getElementById('recibo-txt').textContent).then(()=>alert('Recibo copiado!'));
}
