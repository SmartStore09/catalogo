'use strict';
/* ============ Conexão com o Google Sheets (OAuth 2.0 via Google Identity Services) ============
   Sem service account, sem chave privada no código — o próprio dono da loja faz login uma vez
   por dispositivo/navegador (botão "Conectar" no cabeçalho) e o token fica salvo no localStorage.
   Esse token só permite editar planilhas do Google, nunca aparece em nenhum arquivo do projeto. */

// Client ID do projeto "SmartStore09 PDV" no Google Cloud (criado em 03/07/2026).
// É um identificador público (não é segredo) — termina sempre em ".apps.googleusercontent.com".
// Origens autorizadas: https://smartstore09.github.io (produção) e http://localhost:8901 (testes locais).
const GOOGLE_CLIENT_ID = '1067771380688-hqs51j17b5d99tr8uhkfv1l4hmh649t9.apps.googleusercontent.com';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const LS_GTOKEN = 'ss09_gtoken';

let gisTokenClient = null;

function carregarGIS(){
  return new Promise((resolve, reject) => {
    if(window.google && window.google.accounts && window.google.accounts.oauth2){ resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gis-load-fail'));
    document.head.appendChild(s);
  });
}

function tokenSalvo(){
  const t = ls(LS_GTOKEN);
  if(!t || !t.access_token || !t.expires_at) return null;
  if(Date.now() > t.expires_at - 60000) return null; // considera expirado 1min antes, por segurança
  return t;
}

async function conectarPlanilha(){
  if(GOOGLE_CLIENT_ID.startsWith('COLE_AQUI')){
    alert('Ainda falta configurar o Client ID do Google nesta instalação do PDV.\nIsso é feito uma vez só, em pdv/oauth.js.');
    return;
  }
  try{
    await carregarGIS();
  }catch(e){
    alert('Não consegui falar com o Google agora (sem internet?). Tente de novo quando estiver online.');
    return;
  }
  if(!gisTokenClient){
    gisTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPE,
      callback: (resp) => {
        if(resp.error){ alert('Não consegui conectar à planilha: '+resp.error); atualizarBadgeConexao(); return; }
        const expires_at = Date.now() + (resp.expires_in*1000);
        lsSet(LS_GTOKEN, {access_token:resp.access_token, expires_at});
        atualizarBadgeConexao();
        sincronizarPendentes();
      }
    });
  }
  gisTokenClient.requestAccessToken({prompt: tokenSalvo() ? '' : 'consent'});
}

function atualizarBadgeConexao(){
  const el = document.getElementById('btn-conectar-planilha');
  if(!el) return;
  const conectado = !!tokenSalvo();
  el.classList.toggle('conectado', conectado);
  el.title = conectado ? 'Planilha conectada — clique para reconectar' : 'Conectar ao Google Sheets (sincroniza vendas e estoque)';
}
