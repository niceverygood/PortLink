/**
 * PortLink Driver — Service Worker.
 *
 * 캐시 전략:
 *  - 정적 자산 (icon, fonts): cache-first
 *  - /driver/jobs 페이지 응답: network-first (실패 시 마지막 캐시 표시)
 *  - 그 외: 통과(no-op)
 *
 * 주의: dev에서는 ServiceWorkerRegister 컴포넌트가 등록 안 함.
 * production 빌드 + HTTPS(또는 localhost)에서만 동작.
 */
const CACHE_NAME = 'portlink-driver-v1';
const STATIC_ASSETS = ['/icons/driver/icon.svg'];

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

  // 가용 배차 페이지 — network-first, 실패 시 캐시 fallback
  if (url.pathname === '/driver/jobs' && url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || new Response('오프라인', { status: 503 })),
        ),
    );
    return;
  }

  // 그 외는 통과
});
