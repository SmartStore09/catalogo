'use strict';
/* ================= HISTÓRICO / FECHAMENTO ================= */
function abrirHistorico(dia){
  const hoje=new Date().toLocaleDateString('sv-SE');
  dia=dia||document.getElementById('dia').value||hoje;
  document.getElementById('dia').value=dia;
  const vendas=(ls(LS_VENDAS)||[]).filter(v=>v.dia===dia);
  const tot=r2(vendas.reduce((s,v)=>s+v.total,0));
  const luc=r2(vendas.reduce((s,v)=>s+v.lucro,0));
  const por={PIX:0,DINHEIRO:0,CARTAO:0};
  vendas.forEach(v=>por[v.pag]=r2((por[v.pag]||0)+v.total));
  document.getElementById('resumo').innerHTML=`
    <div class="rcard"><small>Vendas</small><b>${vendas.length}</b></div>
    <div class="rcard"><small>Faturamento</small><b>${fmt(tot)}</b></div>
    <div class="rcard"><small>⚡ PIX / 💵 Dinheiro / 💳 Cartão</small><b style="font-size:13px">${fmt(por.PIX)} · ${fmt(por.DINHEIRO)} · ${fmt(por.CARTAO)}</b></div>
    <div class="rcard"><small>Lucro estimado</small><b>${mostrarLucro?fmt(luc):'••• (botão 👁)'}</b></div>`;
  document.getElementById('vendas-lista').innerHTML = vendas.length ? vendas.slice().reverse().map(v=>{
    const d=new Date(v.ts);
    return `<div class="vrow">
      <div class="vh"><span>#${String(v.n).padStart(4,'0')} · ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · ${v.pag}${v.parcelas>0?' '+v.parcelas+'x':''}</span>
      <span>${fmt(v.total)} <button class="xbtn" title="Excluir venda" onclick="excluirVenda(${v.n})">✕</button></span></div>
      <div class="vi">${v.itens.map(i=>`${i.q}x ${esc(i.n)}`).join(' · ')}</div>
    </div>`;
  }).join('') : '<div id="vazio">Nenhuma venda neste dia.</div>';
  abrir('m-hist');
}
function excluirVenda(n){
  if(!confirm(`Excluir a venda #${n}? (estoque não é devolvido automaticamente)`)) return;
  lsSet(LS_VENDAS,(ls(LS_VENDAS)||[]).filter(v=>v.n!==n));
  abrirHistorico();
}
function limparHistorico(){
  if(!confirm('Apagar TODO o histórico de vendas?\nExporte o CSV antes, se precisar.')) return;
  if(!confirm('Tem certeza? Essa ação não tem volta.')) return;
  lsSet(LS_VENDAS,[]); abrirHistorico();
}
function exportarCSV(){
  const vendas=ls(LS_VENDAS)||[];
  if(!vendas.length){alert('Sem vendas para exportar.');return;}
  let csv='﻿venda;data;hora;codigo;produto;qtd;unitario;total_item;pagamento;parcelas;total_venda;custo_item;lucro_venda\n';
  vendas.forEach(v=>{
    const d=new Date(v.ts);
    const dt=d.toLocaleDateString('pt-BR'), hr=d.toLocaleTimeString('pt-BR');
    v.itens.forEach(it=>{
      csv+=[v.n,dt,hr,it.c,'"'+it.n.replace(/"/g,'""')+'"',it.q,
        String(it.un).replace('.',','),String(r2(it.un*it.q)).replace('.',','),
        v.pag,v.parcelas||'',String(v.total).replace('.',','),
        it.custo!=null?String(it.custo).replace('.',','):'',
        String(v.lucro).replace('.',',')].join(';')+'\n';
    });
  });
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download=`vendas_smartstore09_${new Date().toLocaleDateString('sv-SE')}.csv`;
  a.click();
}
function copiarFechamento(){
  const dia=document.getElementById('dia').value;
  const vendas=(ls(LS_VENDAS)||[]).filter(v=>v.dia===dia);
  const tot=r2(vendas.reduce((s,v)=>s+v.total,0));
  const luc=r2(vendas.reduce((s,v)=>s+v.lucro,0));
  const por={PIX:0,DINHEIRO:0,CARTAO:0};
  vendas.forEach(v=>por[v.pag]=r2((por[v.pag]||0)+v.total));
  const [a,m,d]=dia.split('-');
  let s=`📊 *FECHAMENTO ${LOJA.nome}*\n📅 ${d}/${m}/${a}\n`;
  s+=`────────────────\nVendas: ${vendas.length}\nFaturamento: ${fmt(tot)}\n`;
  s+=`⚡ PIX: ${fmt(por.PIX)}\n💵 Dinheiro: ${fmt(por.DINHEIRO)}\n💳 Cartão: ${fmt(por.CARTAO)}\n`;
  s+=`💰 Lucro estimado: ${fmt(luc)}`;
  navigator.clipboard.writeText(s).then(()=>alert('Fechamento copiado! Cole no WhatsApp ou onde quiser.'));
}
