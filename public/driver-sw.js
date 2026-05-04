/**
 * PortLink Driver — Service Worker.
 *
 * 캐시 전략:
 *  - 정적 자산 (icon, fonts): cache-first
 *  - /driver/* HTML 네비게이션: network-first → 실패 시 캐시 → 그래도 없으면 /driver/offline
 *  - /driver/offline: 사전 캐시 (install 시 prefetch)
 *  - 그 외: 통과(no-op)
 *
 * 주의: dev에서는 ServiceWorkerRegister 컴포넌트가 등록 안 함.
 * production 빌드 + HTTPS(또는 localhost)에서만 동작.
 */
const CACHE_NAME = 'portlink-driver-v2';
const OFFLINE_URL = '/driver/offline';
const STATIC_ASSETS = ['/icons/driver/icon.svg', OFFLINE_URL];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((c) => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 정적 아이콘 — cache-first
  if (url.pathname.startsWith('/icons/driver/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // /driver/* HTML 네비게이션 — network-first, 실패 시 캐시, 그래도 없으면 offline 페이지
  const isDriverNavigation =
    req.mode === 'navigate' &&
    url.origin === self.location.origin &&
    url.pathname.startsWith('/driver');

  if (isDriverNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // 성공 응답만 캐시. opaque/error 응답은 저장 X.
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then(
            (hit) =>
              hit ||
              caches
                .match(OFFLINE_URL)
                .then(
                  (off) =>
                    off || new Response('오프라인', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }),
                ),
          ),
        ),
    );
    return;
  }

  // 그 외는 통과
});
