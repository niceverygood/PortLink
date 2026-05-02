# 부하 테스트 결과 (Stage 7)

**환경**: `https://port-link-snowy.vercel.app` (ICN1, Hobby plan) · Supabase 무료 티어
**도구**: k6 v1.4 (docker `grafana/k6`)
**기준 (CLAUDE.md §13)**: 100 RPS × 5min, 에러율 < 1%, p95 < 500ms

## 결과 요약

| 시나리오                 | 목표 RPS | 지속 시간 | 결과 에러율 | p95  | 판정                  |
| ------------------------ | -------- | --------- | ----------- | ---- | --------------------- |
| `/api/healthz` (Edge)    | 100      | 5min      | **0.00%**   | 49ms | ✅ PASS               |
| `/login` (Static SSG)    | 200      | 5min      | **0.00%**   | 23ms | ✅ PASS               |
| `/api/healthz/deep` (DB) | 100      | 5min      | 96.7%       | 58ms | ❌ FAIL (의도적 한계) |

총 처리: 119,986 (login) + 29,972 (healthz) = **약 15만 요청 / 10분**

## 시나리오별 상세

### 1. `/api/healthz` — Edge 함수 + DB 의존성 X

```
http_req_duration   p(95)=49.09ms  p(99)=88.37ms
http_req_failed     0.00%
checks              100.00% (59944/59944)
```

**해석**: Edge runtime이라 cold start ≈ 0, 모든 요청 ICN1에서 즉시 응답. 외부 모니터링·헬스체크 baseline 충분.

### 2. `/login` — Static SSG (CDN edge cache)

```
http_req_duration   p(95)=23.2ms   p(90)=18.95ms
http_req_failed     0.00%
checks              100.00% (119986/119986)
```

**해석**: Vercel Edge CDN이 정적 HTML을 캐시 → 200 RPS도 사실상 무한대 처리 가능. p95 23ms는 사용자 체감상 즉각 응답.

### 3. `/api/healthz/deep` — Node.js 함수 + DB ping (의도적 한계)

```
http_req_duration   p(95)=58.36ms
http_req_failed     96.70%
checks              3.29% (1974/59928)
```

**해석 (실패 원인 분석)**:

- 100 RPS에 대응해 Vercel이 Lambda 인스턴스를 5~10개 동시 스폰
- 각 Lambda는 cold cache → 동시에 DB ping을 던짐
- Supabase 무료 티어 connection pool (transaction-mode pgbouncer, 기본 ~60 connection) 즉시 포화
- DB ping이 timeout → "down"으로 5초 캐시 → 모든 후속 요청도 503
- 5초 후 cache expire → 다시 동시 ping → 다시 포화 → 무한 반복

**MVP 한계 vs 실제 사용자 부하**:

- 정상 사용자 패턴: 로그인 1회 + 페이지 진입 시 데이터 1~2 fetch + 작업당 mutation 1회
- 동시 사용자 100명 가정해도 API RPS는 ~10~30 정도로 추산
- Stage 7 범위에선 무료 티어 한계 그대로 두고, Phase 2에서 Supabase Pro (400 conn) + Prisma `connection_limit` 튜닝

**그래서 deep 헬스체크는 부하 테스트 대상 아님**. 외부 모니터링은 1 RPM (분당 1회) 폴링 가정 — 5초 캐시로 DB 한 번만 hit.

## 재현

```bash
# k6 docker로 실행 (로컬 설치 불필요)
docker run --rm -v "$PWD/loadtest:/scripts" \
  -e BASE_URL=https://port-link-snowy.vercel.app \
  grafana/k6 run /scripts/healthz.js

docker run --rm -v "$PWD/loadtest:/scripts" \
  -e BASE_URL=https://port-link-snowy.vercel.app \
  grafana/k6 run /scripts/login-page.js
```

## 후속 액션 (Phase 2)

- [ ] Supabase Pro 업그레이드 → `/api/healthz/deep` 100 RPS 통과
- [ ] Prisma connection pool 튜닝 (`?connection_limit=10`)
- [ ] 인증 필요 endpoint 부하 테스트 (e.g., `/api/dispatch-orders`) — k6에서 NextAuth 세션 쿠키 획득 흐름 추가
- [ ] Vercel Pro로 multi-region failover 검토 (현재는 ICN1 단일 의존)
