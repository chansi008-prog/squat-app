// 하루 스쿼트 서비스 워커: 앱 파일을 저장해 인터넷 없이도 열리게 한다. 새 버전이 있으면 먼저 받는다.
const VERSION = "hsquat-v1";
const CORE = ["./", "index.html", "app.js", "squat.js", "style.css", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-touch.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const key = e.request.mode === "navigate" ? "index.html" : e.request;
  if (url.origin !== location.origin) {           // 글꼴(CDN)은 한 번 받으면 저장해 둔다
    e.respondWith(caches.open(VERSION).then(async c => (await c.match(e.request)) || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })));
    return;
  }
  e.respondWith(caches.open(VERSION).then(async c => {
    try {
      const r = await fetch(e.request);
      if (r.ok) c.put(key, r.clone());
      return r;
    } catch {
      const hit = await c.match(key, { ignoreSearch: true });
      if (hit) return hit;
      throw new Error("offline");
    }
  }));
});
