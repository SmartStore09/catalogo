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

function linhasParaProdutos(rows){
  let h=-1;
  for(let i=0;i<rows.length;i++){
    const c0=(rows[i][0]||'').trim().toUpperCase();
    if(c0==='CÓDIGO'||c0==='CODIGO'){h=i;break;}
  }
  if(h<0) return [];
  const out=[];
  for(let i=h+1;i<rows.length;i++){
    const r=rows[i];
    const c0=(r[0]||'').trim();
    if(!c0 || c0.toUpperCase().startsWith('TOTAL')) continue;
    if(!(r[2]||'').trim()) continue;            // linha separadora de categoria
    const estq = (r[8]||'').trim();
    out.push({
      c:c0, cat:limpaCat(r[1]), n:(r[2]||'').trim(), m:(r[3]||'').trim(), e:(r[4]||'').trim(),
      p:brl(r[5]), pix:brl(r[6]), custo:brl(r[7]),
      estq: estq==='' ? null : (parseInt(estq,10)||0),
      st:(r[9]||'Ativo').trim(), obs:(r[11]||'').trim(),
      linha:i+1, estqCol:8, abaGid:GID // usados na Tarefa 4 p/ escrever a baixa de estoque de volta na planilha
    });
  }
  return out;
}
const embutidoParaProdutos = () => EMBUTIDO.map(a=>({c:a[0],cat:a[1],n:a[2],m:a[3],e:a[4],p:a[5],pix:a[6],custo:a[7],estq:a[8],st:a[9],obs:a[10]}));

/* ================= CARREGAR CATÁLOGO ================= */
async function carregarCatalogo(manual){
  const badge=document.getElementById('status-cat');
  badge.className='badge off'; badge.textContent='catálogo: carregando…';
  for(const url of FONTES_CSV){
    try{
      const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),9000);
      const resp=await fetch(url,{signal:ctl.signal,cache:'no-store'});
      clearTimeout(t);
      if(!resp.ok) continue;
      const txt=await resp.text();
      if(!/C[ÓO]DIGO/i.test(txt)) continue;
      const prods=linhasParaProdutos(parseCSV(txt));
      if(prods.length>10){
        CATALOGO=prods;
        lsSet(LS_CACHE,{t:Date.now(),prods});
        badge.className='badge on';
        badge.textContent=`catálogo: planilha ✓ (${prods.length} itens)`;
        renderChips(); renderLista(); return;
      }
    }catch(e){/* tenta a próxima fonte */}
  }
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
