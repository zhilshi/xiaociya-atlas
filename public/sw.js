/* 小词芽 offline cache (adapted from Word Atlas, MIT): app shell network-first, everything else cache-first.
 * Word Atlas pictures and recordings (/wa/thumb, /wa/uk, /wa/us) never change, so they live in
 * a separate media cache that survives app updates and is capped (oldest first) at MEDIA_MAX. */
const VERSION = "wordsprout-v2";
const SHELL = `${VERSION}-shell`;
const MEDIA = "wordsprout-media-1";
const MEDIA_MAX = 3000;
const MEDIA_RE = /\/wa\/(thumb|uk|us)\//;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION) && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isShell = req.mode === "navigate";
  if (isShell) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(SHELL).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(new URL("./", self.registration.scope).href))),
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            const media = MEDIA_RE.test(url.pathname);
            const name = media ? MEDIA : SHELL;
            caches.open(name).then((c) => c.put(req, copy)).then(() => trim(name, media ? MEDIA_MAX : 200));
          }
          return res;
        }),
    ),
  );
});
