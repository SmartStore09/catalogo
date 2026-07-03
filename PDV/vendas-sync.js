'use strict';
/* ============ Sincronização de vendas e estoque com o Google Sheets (Sheets API v4) ============
   Fluxo: finalizar() já salva a venda no localStorage e baixa o estoque localmente (offline-first,
   nunca muda). Depois disso chamamos sincronizarVenda() aqui: se tiver token e internet, grava na
   aba VENDAS e atualiza o estoque na planilha; se falhar (ou estiver offline), a venda entra numa
   fila local e tenta de novo mais tarde (quando reconectar ou reabrir o PDV). */

const LS_FILA_SYNC = 'ss09_fila_sync';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

let mapaAbasCache = null; // { [gid]: 'título exato da aba' } — evita perguntar de novo à API a cada venda

function colLetra(idx){
  let s=''; idx++;
  while(idx>0){ const m=(idx-1)%26; s=String.fromCharCode(65+m)+s; idx=Math.floor((idx-1)/26); }
  return s;
}

async function apiSheets(token, path, opts={}){
  const resp = await fetch(`${SHEETS_API}/${SHEET_ID}${path}`, {
    ...opts,
    headers: {'Authorization':'Bearer '+token, 'Content-Type':'application/json', ...(opts.headers||{})}
  });
  if(!resp.ok){
    const txt = await resp.text().catch(()=>'');
    throw new Error(`Sheets API ${resp.status}: ${txt.slice(0,200)}`);
  }
  return resp.json();
}

async function obterNomeAba(token, gid){
  if(mapaAbasCache && mapaAbasCache[gid]) return mapaAbasCache[gid];
  const meta = await apiSheets(token, '?fields=sheets.properties');
  mapaAbasCache = {};
  (meta.sheets||[]).forEach(s => { mapaAbasCache[s.properties.sheetId] = s.properties.title; });
  return mapaAbasCache[gid];
}

async function garantirAbaVendas(token){
  const meta = await apiSheets(token, '?fields=sheets.properties.title');
  const existe = (meta.sheets||[]).some(s => s.properties.title === 'VENDAS');
  if(existe) return;
  await apiSheets(token, ':batchUpdate', {
    method:'POST',
    body: JSON.stringify({requests:[{addSheet:{properties:{title:'VENDAS'}}}]})
  });
  await apiSheets(token, '/values/VENDAS!A1:J1?valueInputOption=USER_ENTERED', {
    method:'PUT',
    body: JSON.stringify({values:[['Data','Hora','Código','Produto','Qtd','Preço Unit','Total','Forma Pgto','Desconto PIX','Obs']]})
  });
}

function linhasVendaParaPlanilha(venda){
  const d = new Date(venda.ts);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  // desconto PIX da venda inteira só aparece na 1ª linha do item, p/ não somar em dobro num relatório
  return venda.itens.map((it,idx) => [
    data, hora, it.c, it.n, it.q,
    it.un, r2(it.un*it.q), venda.pag,
    idx===0 ? (venda.descPix||0) : 0,
    `Venda #${venda.n}`
  ]);
}

async function registrarVendaNaPlanilha(venda, token){
  await garantirAbaVendas(token);
  await apiSheets(token, '/values/VENDAS!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS', {
    method:'POST',
    body: JSON.stringify({values: linhasVendaParaPlanilha(venda)})
  });
}

async function baixarEstoqueNaPlanilha(venda, token){
  const porAba = {}; // { 'Nome da aba': [{range, values}] }
  for(const it of venda.itens){
    const prod = CATALOGO.find(p => p.c === it.c);
    if(!prod || prod.linha == null || prod.estqCol == null) continue; // sem info de linha -> não sincroniza esse item
    const abaNome = prod.abaGid != null ? await obterNomeAba(token, prod.abaGid) : prod.aba;
    if(!abaNome) continue;
    const estoqueAtual = estoqueDe(prod); // já reflete a baixa local feita em finalizar()
    if(!porAba[abaNome]) porAba[abaNome] = [];
    porAba[abaNome].push({range: `'${abaNome}'!${colLetra(prod.estqCol)}${prod.linha}`, values:[[estoqueAtual]]});
  }
  const data = Object.values(porAba).flat();
  if(!data.length) return;
  await apiSheets(token, '/values:batchUpdate', {
    method:'POST',
    body: JSON.stringify({valueInputOption:'USER_ENTERED', data})
  });
}

/* Ajuste manual de estoque (toque no "estq: N" pra digitar um novo número) — reflete direto
   na planilha, sem esperar uma venda. Só roda se já estiver conectado; se não tiver conexão,
   fica só local mesmo (o próximo ajuste ou venda acaba corrigindo quando reconectar). */
async function sincronizarEstoqueManual(prod, novoValor){
  if(prod.linha == null || prod.estqCol == null) return; // produto sem linha rastreada na planilha
  const token = tokenSalvo();
  if(!token) return;
  try{
    const abaNome = prod.abaGid != null ? await obterNomeAba(token.access_token, prod.abaGid) : prod.aba;
    if(!abaNome) return;
    await apiSheets(token.access_token, '/values:batchUpdate', {
      method:'POST',
      body: JSON.stringify({valueInputOption:'USER_ENTERED', data:[
        {range:`'${abaNome}'!${colLetra(prod.estqCol)}${prod.linha}`, values:[[novoValor]]}
      ]})
    });
  }catch(e){ console.warn('[estoque] falha ao sincronizar ajuste manual:', e); }
}

function enfileirarVenda(n){
  const fila = ls(LS_FILA_SYNC) || [];
  if(!fila.includes(n)){ fila.push(n); lsSet(LS_FILA_SYNC, fila); }
}
function removerDaFila(n){
  lsSet(LS_FILA_SYNC, (ls(LS_FILA_SYNC) || []).filter(x => x!==n));
}

async function sincronizarVenda(venda){
  const token = tokenSalvo();
  if(!token){ enfileirarVenda(venda.n); atualizarBadgeFila(); return; }
  try{
    await registrarVendaNaPlanilha(venda, token.access_token);
    await baixarEstoqueNaPlanilha(venda, token.access_token);
    removerDaFila(venda.n);
  }catch(e){
    enfileirarVenda(venda.n);
  }
  atualizarBadgeFila();
}

async function sincronizarPendentes(){
  const token = tokenSalvo();
  if(!token) return;
  const fila = ls(LS_FILA_SYNC) || [];
  if(!fila.length) return;
  const vendas = ls(LS_VENDAS) || [];
  for(const n of [...fila]){
    const venda = vendas.find(v => v.n === n);
    if(!venda){ removerDaFila(n); continue; } // venda foi excluída do histórico local
    try{
      await registrarVendaNaPlanilha(venda, token.access_token);
      await baixarEstoqueNaPlanilha(venda, token.access_token);
      removerDaFila(n);
    }catch(e){ break; /* provavelmente ainda sem internet — tenta de novo depois */ }
  }
  atualizarBadgeFila();
}

function atualizarBadgeFila(){
  const el = document.getElementById('badge-sync-fila');
  if(!el) return;
  const n = (ls(LS_FILA_SYNC)||[]).length;
  el.style.display = n ? '' : 'none';
  el.textContent = n ? `⏳ ${n} venda${n>1?'s':''} p/ sincronizar` : '';
}

window.addEventListener('online', sincronizarPendentes);
