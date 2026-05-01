# 009 — PWA는 next-pwa 미사용, 직접 manifest + SW 작성

- **Context**: PWA 솔루션 후보 — next-pwa(Workbox 기반, 무거움), Serwist, 자체 작성. 차주 앱 캐시 요구사항은 단순(가용 배차 마지막 응답 1건만 폴백).
- **Decision**: 의존성 0개 추가, `public/driver-sw.js` 직접 작성 (~70줄). `src/app/driver/manifest.webmanifest/route.ts`가 JSON 응답. middleware의 `PUBLIC_PATHS`에 manifest 경로 등록 (인증 없이 접근).
- **Consequences**: 빌드 사이즈/의존성 영향 0. SW 갱신 시 `CACHE_NAME` bump. iOS apple-touch-icon용 PNG는 사용자 ZIP 도착 시 추가 (현재는 SVG 1개 — Chrome/Android 정상, iOS는 generic 아이콘).
