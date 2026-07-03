'use strict';
/* Service Worker do PDV Smart Store 09 — cache-first com atualização em segundo plano.
   As chamadas à planilha do Google (catálogo) NUNCA são cacheadas: precisam vir sempre
   da rede para o PDV mostrar estoque/preço atualizado; o fallback offline já é tratado
   pelo próprio app (catálogo EMBUTIDO em config.js). */

const CACHE = 'ss09-pdv-v9';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './config.js',
  './sheets.js',
  './acessorios.js',
  './estoque.js',
  './oauth.js',
  './vendas-sync.js',
  './carrinho.js',
  './pagamento.js',
  './historico.js',
  './financeiro.js',
  './app.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // só cacheamos os arquivos do próprio PDV — Sheets API, OAuth etc. sempre direto na rede

  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(resp => {
        if(resp && resp.ok && url.origin === self.location.origin){
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
