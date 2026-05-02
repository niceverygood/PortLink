/**
 * k6 부하 테스트 — /login (static SSG 페이지) baseline.
 *
 * Vercel Edge CDN 캐시 + ICN1 fallback origin 성능 측정.
 * /api/healthz보다 부하가 가벼우므로 200 RPS로 상향.
 *
 * 실행:
 *   docker run --rm -i -v "$PWD/loadtest:/scripts" \
 *     -e BASE_URL=https://port-link-snowy.vercel.app \
 *     grafana/k6 run /scripts/login-page.js
 */
import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL || 'https://port-link-snowy.vercel.app';

export const options = {
  scenarios: {
    steady_200rps: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.005'], // 에러율 < 0.5%
    http_req_duration: ['p(95)<300'], // CDN 캐시 → 300ms 충분
  },
};

export default function () {
  const res = http.get(`${BASE}/login`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
    'has html': (r) => r.body.includes('PortLink'),
  });
}
