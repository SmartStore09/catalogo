'use strict';
/* ================= PARSE CSV (planilha) ================= */
function parseCSV(text){
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){
      if(ch==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; }
      else cur+=ch;
    }else{
      if(ch==='"') q=true;
      else if(ch===','){ row.push(cur); cur=''; }
      else if(ch==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; }
      else if(ch!=='\r') cur+=ch;
    }
  }
  if(cur!==''||row.length){ row.push(cur); rows.push(row); }
  return rows;
}
const brl = s => {
  if(s==null) return null;
  const t=String(s).replace(/[R$\s]/g,'').trim();
  if(!t) return null;
  const n=parseFloat(t.replace(/\./g,'').replace(',','.'));
  return isNaN(n)?null:n;
};
const limpaCat = s => String(s||'').replace(/^[^0-9A-Za-zÀ-ÿ⚙]+/u,'').replace(/^⚙️?\s*/,'').trim();

/* Colunas identificadas pelo texto do cabeçalho (não por posição fixa) — a planilha já mudou de
   layout uma vez (colunas internas Preço Compra/Lucro/Margem inseridas antes de Estoque/Status),
   então depender de índice fixo quebra fácil. */
function mapaColunasCatalogo(headerRow){
  const map={};
  headerRow.forEach((h,i)=>{
    const n=normHeader(h);
    if(map.codigo===undefined && /codigo/.test(n)) map.codigo=i;
    else if(map.categoria===undefined && /categoria/.test(n)) map.categoria=i;
    else if(map.nome===undefined && /produto/.test(n)) map.nome=i;
    else if(map.marca===undefined && /marca/.test(n)) map.marca=i;
    else if(map.espec===undefined && /especifica/.test(n)) map.espec=i;
    else if(map.pix===undefined && /pix/.test(n)) map.pix=i;
    else if(map.preco===undefined && /venda/.test(n)) map.preco=i;
    else if(map.custo===undefined && /compra/.test(n)) map.custo=i;
    else if(map.estq===undefined && /estoque|qtd/.test(n)) map.estq=i;
    else if(map.status===undefined && /status/.test(n)) map.status=i;
    else if(map.obs===undefined && /observa/.test(n)) map.obs=i;
  });
  return map;
}

function linhasParaProdutos(rows){
  let h=-1, map=null;
  for(let i=0;i<rows.length;i++){
    const m=mapaColunasCatalogo(rows[i]);
    if(m.codigo!==undefined && m.nome!==undefined){ h=i; map=m; break; }
  }
  if(h<0) return [];
  const out=[];
  for(let i=h+1;i<rows.length;i++){
    const r=rows[i];
    const c0=(r[map.codigo]||'').trim();
    if(!c0 || c0.toUpperCase().startsWith('TOTAL')) continue;
    const nome=(map.nome!==undefined?(r[map.nome]||''):'').trim();
    if(!nome) continue;                          // linha separadora de categoria
    const estq = map.estq!==undefined ? (r[map.estq]||'').trim() : '';
    out.push({
      c:c0, cat:limpaCat(map.categoria!==undefined?r[map.categoria]:''), n:nome,
      m:(map.marca!==undefined?(r[map.marca]||''):'').trim(),
      e:(map.espec!==undefined?(r[map.espec]||''):'').trim(),
      p: map.preco!==undefined?brl(r[map.preco]):null,
      pix: map.pix!==undefined?brl(r[map.pix]):null,
      custo: map.custo!==undefined?brl(r[map.custo]):null,
      estq: estq==='' ? null : (parseInt(estq,10)||0),
      st: (map.status!==undefined?(r[map.status]||''):'').trim() || 'Ativo',
      obs: (map.obs!==undefined?(r[map.obs]||''):'').trim(),
      linha:i+1, estqCol: map.estq!==undefined?map.estq:null, abaGid: GID_CATALOGO
    });
  }
  return out;
}
const embutidoParaProdutos = () => EMBUTIDO.map(a=>({c:a[0],cat:a[1],n:a[2],m:a[3],e:a[4],p:a[5],pix:a[6],custo:a[7],estq:a[8],st:a[9],obs:a[10]}));

/* ================= CARREGAR CATÁLOGO ================= */
async function carregarCatalogo(manual){
  const badge=document.getElementById('status-cat');
  badge.className='badge off'; badge.textContent='catálogo: carregando…';
  try{
    const texto = await fetchCSVPorGid(GID_CATALOGO);
    if(texto){
      const prods=linhasParaProdutos(parseCSV(texto));
      if(prods.length>10){
        CATALOGO=prods;
        lsSet(LS_CACHE,{t:Date.now(),prods});
        badge.className='badge on';
        badge.textContent=`catálogo: planilha ✓ (${prods.length} itens)`;
        renderChips(); renderLista(); return;
      }
      console.warn('[catalogo] aba encontrada mas com poucas linhas úteis ('+prods.length+') — conferir cabeçalhos');
    }
  }catch(e){ console.warn('[catalogo] falha ao carregar catálogo da planilha:', e); }

  const cache=ls(LS_CACHE);
  if(cache && cache.prods && cache.prods.length){
    CATALOGO=cache.prods;
    badge.className='badge off';
    badge.textContent=`catálogo: cópia local de ${new Date(cache.t).toLocaleDateString('pt-BR')} (${CATALOGO.length} itens)`;
  }else{
    CATALOGO=embutidoParaProdutos();
    badge.className='badge off';
    badge.textContent=`catálogo: offline — versão 07/06/2026 (${CATALOGO.length} itens)`;
  }
  if(manual) alert('Não consegui ler a planilha agora.\nUsando a última cópia local.\n\nPara atualização automática: na planilha, Compartilhar → "Qualquer pessoa com o link: Leitor".');
  renderChips(); renderLista();
}
