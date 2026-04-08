'use strict';

const APP_VERSION   = 'ecodrive-v2';
const STATIC_CACHE  = `${APP_VERSION}-static`;
const RUNTIME_CACHE = `${APP_VERSION}-runtime`;
const TILE_CACHE    = `${APP_VERSION}-tiles`;

/* Assets mis en cache à l'installation (cache-first pour l'app shell) */
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

/* Ressources tierces avec longue durée de vie (cache-first) */
const LONG_LIVED_ORIGINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unpkg.com',
  'cdnjs.cloudflare.com',
];

/* Origines de tuiles cartographiques */
const TILE_ORIGINS = [
  'basemaps.cartocdn.com',
  'server.arcgisonline.com',
];

/* ── INSTALLATION ──────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATION — nettoyage des anciens caches ─────────────────── */
self.addEventListener('activate', event => {
  const CURRENT = new Set([STATIC_CACHE, RUNTIME_CACHE, TILE_CACHE]);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !CURRENT.has(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── FETCH — stratégies différenciées ─────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* 1. Tuiles cartographiques — Cache first (TTL 7 jours) */
  if (TILE_ORIGINS.includes(url.hostname)) {
    event.respondWith(tileStrategy(request));
    return;
  }

  /* 2. Polices & scripts tiers à longue durée de vie — Cache first */
  if (LONG_LIVED_ORIGINS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  /* 3. App shell (same origin, GET) — Stale-While-Revalidate */
  if (request.method === 'GET' && url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  /* 4. API data.economie.gouv.fr — Network first, cache fallback 5 min */
  if (url.hostname.includes('data.economie.gouv.fr')) {
    event.respondWith(networkFirstWithTimeout(request, RUNTIME_CACHE, 8000, 300));
    return;
  }

  /* 5. Autres requêtes réseau — Network only */
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

/* ══════════════════════════════════════════════════════════════════
   STRATÉGIES
══════════════════════════════════════════════════════════════════ */

/** Cache first — sert depuis le cache, sinon réseau + mise en cache */
async function cacheFirst(request, cacheName) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Ressource indisponible hors-ligne', { status: 503 });
  }
}

/** Stale-While-Revalidate — sert immédiatement depuis le cache
 *  et met à jour le cache en arrière-plan */
async function staleWhileRevalidate(request, cacheName) {
  const cache      = await caches.open(cacheName);
  const cached     = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || (await fetchPromise) ||
    new Response('App indisponible hors-ligne', { status: 503 });
}

/** Network first avec timeout — idéal pour les APIs à données fraîches */
async function networkFirstWithTimeout(request, cacheName, timeoutMs, ttlSeconds) {
  const cache = await caches.open(cacheName);

  try {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), timeoutMs);
    const response   = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);

    if (response.ok) {
      // Ajouter un header TTL pour invalidation future
      const headers  = new Headers(response.headers);
      headers.set('sw-cached-at', Date.now().toString());
      headers.set('sw-ttl',       ttlSeconds.toString());
      const cloned = new Response(await response.clone().blob(), { status: response.status, headers });
      cache.put(request, cloned);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
      const ttl      = parseInt(cached.headers.get('sw-ttl') || '0');
      if (Date.now() - cachedAt < ttl * 1000) return cached;
    }
    return cached || new Response(JSON.stringify({ error: 'offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

/** Stratégie dédiée aux tuiles — cache long (7 jours), limite à 500 entrées */
async function tileStrategy(request) {
  const cache  = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Limiter la taille du cache tuiles
      cache.put(request, response.clone());
      trimCache(TILE_CACHE, 500);
    }
    return response;
  } catch {
    return cached || new Response('Tuile indisponible hors-ligne', { status: 503 });
  }
}

/** Supprime les entrées les plus anciennes au-delà de maxEntries */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys  = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map(k => cache.delete(k)));
  }
}
