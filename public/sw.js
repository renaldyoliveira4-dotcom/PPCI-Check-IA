// Service Worker do PPCI Check IA
//
// Mantido intencionalmente simples: o objetivo principal aqui é
// HABILITAR A INSTALAÇÃO do PWA (o navegador exige um service worker
// registrado para considerar o site instalável), não implementar um
// modo offline completo.
//
// Por quê: este é um SaaS com dados que mudam a cada acesso (saldo de
// tokens, status de análises, relatórios). Um cache agressivo de
// páginas/API poderia mostrar informação desatualizada para o usuário
// (ex: saldo de tokens errado) -- um risco pior do que simplesmente não
// funcionar 100% offline. Por isso, cacheamos apenas assets estáticos
// (ícones, manifest) que não mudam, e deixamos toda navegação e chamada
// de API passar direto para a rede.

const CACHE_NAME = "ppci-check-ia-v1";
const STATIC_ASSETS = [
  "/icons/icon-192.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Só intercepta requisições para os assets estáticos conhecidos.
  // Qualquer outra coisa (páginas, API, dados) vai direto para a rede,
  // sempre buscando a versão mais atual.
  const isStaticAsset = STATIC_ASSETS.some((asset) => url.pathname === asset);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // Para todo o resto, não chama event.respondWith() -- o navegador
  // segue com o comportamento padrão de rede.
});
