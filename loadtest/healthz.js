/**
 * k6 부하 테스트 — /api/healthz baseline.
 *
 * 목표 (CLAUDE.md §13):
 *   - 100 RPS × 5min 지속
 *   - 에러율 < 1%
 *   - p95 응답시간 < 500ms
 *
 * 실행:
 *   docker run --rm -i -v "$PWD/loadtest:/scripts" \
 *     -e BASE_URL=https://port-link-snowy.vercel.app \
 *     grafana/k6 run /scripts/healthz.js
 *
 * 또는 로컬에 k6 설치:
 *   brew install k6
 *   BASE_URL=https://port-link-snowy.vercel.app k6 run loadtest/healthz.js
 */
import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL || 'https://port-link-snowy.vercel.app';

export const options = {
  scenarios: {
    steady_100rps: {
      executor: 'constant-arrival-rate',
      rate: 100, // 100 req/s
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // 에러율 < 1%
    http_req_duration: ['p(95)<500'], // p95 < 500ms
    'http_req_duration{status:200}': ['p(99)<1000'], // 정상응답 p99 < 1s
  },
};

export default function () {
  const res = http.get(`${BASE}/api/healthz`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'db up': (r) => {
      try {
        return r.json('db') === 'up';
      } catch {
        return false;
      }
    },
  });
}
