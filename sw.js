/* =========================================================================
   sw.js — SERVICE WORKER (makes the app work OFFLINE).
   -------------------------------------------------------------------------
   NOTE: A service worker is a script the browser runs in the background,
   separate from the page. Its job here: on first visit it CACHES all the
   app files; on later visits it serves them from the cache, so the app
   opens even with no internet (e.g. on reserve duty with no signal).

   Lifecycle:
     install  -> download & cache the file list below.
     activate -> clean up old caches when you bump CACHE_VERSION.
     fetch    -> intercept every request; serve from cache first.
   ========================================================================= */

/* NOTE: bump this version string whenever you change app files, so the
   service worker knows to refresh its cache instead of serving stale files. */
const CACHE_VERSION = 'ds-trainer-v5';

/* The files that make up the whole app. */
const FILES_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/quiz.js',
  './js/app.js',
  './js/viz.js',
  './js/viz-ops.js',
  './js/complexity.js',
  './manifest.json',
  './data/topics.json',
  './data/time-complexity.json',
  './data/arrays.json',
  './data/linked-lists.json',
  './data/skip-lists.json',
  './data/queues.json',
  './data/trees.json',
  './data/advanced-trees.json',
  './data/sorting.json',
  './data/searching.json',
  './data/hashing.json',
  './data/complexity.json'
];

/* INSTALL: pre-cache everything. */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

/* ACTIVATE: delete caches from older versions. */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* FETCH: cache-first. Try the cache; fall back to the network. */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
