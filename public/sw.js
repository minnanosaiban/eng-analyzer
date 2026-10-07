const CACHE = "eng-analyzer-v4";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./relagrid/icons.js", "./relagrid/colors.js", "./relagrid/model.js", "./relagrid/parser.js", "./relagrid/renderer.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// 自サイトのファイルのみ: ネットワーク優先(更新を反映)、オフライン時はキャッシュ。Gemini API 等は素通し。
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  // OpenMoji の画像はバージョン固定なのでキャッシュ優先(オフラインでも表示)
  if (u.hostname === "cdn.jsdelivr.net" && u.pathname.startsWith("/npm/openmoji@")) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return res; })));
    return;
  }
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});
