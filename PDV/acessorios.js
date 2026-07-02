'use strict';
/* ============ CAPINHAS e PELÍCULAS — carrega por modelo/SKU da planilha ============
   Os produtos aqui viram itens normais dentro de CATALOGO (mesma forma {c,cat,n,m,e,p,pix,...}),
   então carrinho, baixa de estoque, busca e finalização de venda já funcionam sem nenhuma
   mudança nesses módulos. */

const normHeader = s => String(s||'').toLowerCase()
  .replace(/[áàâã]/g,'a').replace(/[éê]/g,'e').replace(/í/g,'i')
  .replace(/[óôõ]/g,'o').replace(/ú/g,'u').replace(/ç/g,'c').trim();

function mapaColunas(headerRow){
  const map={};
  headerRow.forEach((h,i)=>{
    const n=normHeader(h);
    if(map.codigo===undefined && /codigo|sku/.test(n)) map.codigo=i;
    else if(map.modelo===undefined && /modelo|compat|aparelho|celular/.test(n)) map.modelo=i;
    else if(map.nome===undefined && /produto|nome|descricao|item/.test(n)) map.nome=i;
    else if(map.estq===undefined && /qtd|quant|estoque/.test(n)) map.estq=i;
    else if(map.pix===undefined && /pix/.test(n)) map.pix=i;
    else if(map.preco===undefined && /preco|valor/.test(n)) map.preco=i;
    else if(map.status===undefined && /status|disponi/.test(n)) map.status=i;
    else if(map.tipo===undefined && /tipo|categoria|variante/.test(n)) map.tipo=i;
  });
  return map;
}

function parseAcessorios(rows, categoria, precoPadrao, origem){
  if(!rows || !rows.length) return [];
  let h=-1, map=null;
  for(let i=0;i<Math.min(rows.length,15);i++){
    const m=mapaColunas(rows[i]);
    if(m.modelo!==undefined || m.codigo!==undefined){ h=i; map=m; break; }
  }
  if(h<0) return [];
  const prefixo = categoria==='Capinhas' ? 'CAP' : 'PEL';
  const out=[]; let seq=1;
  for(let i=h+1;i<rows.length;i++){
    const r=rows[i];
    const modelo=(map.modelo!==undefined?(r[map.modelo]||''):'').trim();
    if(!modelo) continue;
    const status = map.status!==undefined ? (r[map.status]||'').trim() : '';
    if(/indispon/i.test(status)) continue;
    const tipo = map.tipo!==undefined ? (r[map.tipo]||'').trim() : '';
    const padrao = precoPadrao(tipo);
    const precoCel = map.preco!==undefined ? brl(r[map.preco]) : null;
    const pixCel = map.pix!==undefined ? brl(r[map.pix]) : null;
    const estqTxt = map.estq!==undefined ? (r[map.estq]||'').trim() : '';
    let codigo = map.codigo!==undefined ? (r[map.codigo]||'').trim() : '';
    if(!codigo) codigo = `${prefixo}-${String(seq).padStart(4,'0')}-${modelo.replace(/[^A-Za-z0-9]+/g,'').slice(0,10).toUpperCase()}`;
    seq++;
    const nome = (map.nome!==undefined && (r[map.nome]||'').trim())
      ? r[map.nome].trim()
      : `${categoria==='Capinhas'?'Capinha':'Película'}${tipo?' '+tipo:''} — ${modelo}`;
    out.push({
      c:codigo, cat:categoria, n:nome, m:tipo||categoria, e:modelo,
      p: precoCel!=null?precoCel:padrao.venda,
      pix: pixCel!=null?pixCel:padrao.pix,
      custo:null,
      estq: estqTxt===''?null:(parseInt(estqTxt,10)||0),
      st:'Ativo', obs:'',
      linha:i+1, estqCol: map.estq!==undefined?map.estq:null, ...origem // usados na Tarefa 4 p/ escrever a baixa de estoque de volta na planilha
    });
  }
  return out;
}

async function fetchCSVPorNomeAba(nomes){
  for(const nome of nomes){
    const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(nome)}`;
    try{
      const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),9000);
      const resp=await fetch(url,{signal:ctl.signal,cache:'no-store'});
      clearTimeout(t);
      if(!resp.ok) continue;
      const txt=await resp.text();
      if(/^\s*<(!DOCTYPE|html)/i.test(txt)) continue; // página de erro do Google, não é CSV
      return {texto:txt, nome}; // "nome" = título exato da aba, usado depois p/ escrever de volta (Tarefa 4)
    }catch(e){ /* tenta o próximo nome de aba */ }
  }
  return null;
}

async function fetchCSVPorGid(gid){
  const urls=[
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`
  ];
  for(const url of urls){
    try{
      const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),9000);
      const resp=await fetch(url,{signal:ctl.signal,cache:'no-store'});
      clearTimeout(t);
      if(!resp.ok) continue;
      const txt=await resp.text();
      if(/^\s*<(!DOCTYPE|html)/i.test(txt)) continue;
      return txt;
    }catch(e){ /* tenta a próxima URL */ }
  }
  return null;
}

async function carregarAcessorios(){
  try{
    const resCap = await fetchCSVPorNomeAba(NOMES_ABA_CAPINHAS);
    if(resCap) CATALOGO = CATALOGO.concat(parseAcessorios(parseCSV(resCap.texto), 'Capinhas', precoCapinha, {aba:resCap.nome}));
  }catch(e){/* segue sem capinhas por modelo — itens genéricos do catálogo continuam disponíveis */}
  try{
    let texto = await fetchCSVPorGid(GID_PELICULAS);
    let origem = {abaGid: GID_PELICULAS};
    if(!texto){
      const resPel = await fetchCSVPorNomeAba(NOMES_ABA_PELICULAS);
      if(resPel){ texto = resPel.texto; origem = {aba: resPel.nome}; }
    }
    if(texto) CATALOGO = CATALOGO.concat(parseAcessorios(parseCSV(texto), 'Películas', precoPelicula, origem));
  }catch(e){/* segue sem películas por modelo — itens genéricos do catálogo continuam disponíveis */}
}

/* Carrega catálogo principal + capinhas/películas por modelo, depois renderiza uma vez */
async function carregarTudo(manual){
  await carregarCatalogo(manual);
  await carregarAcessorios();
  renderChips(); renderLista();
}
