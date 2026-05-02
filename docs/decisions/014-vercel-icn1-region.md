# 014 — Vercel 함수 리전을 ICN1(Seoul) 강제

- **Context**: 첫 프로덕션 배포 후 페이지 로드가 2~3초로 매우 느렸음. Supabase Postgres는 서울 리전(`ap-northeast-2`)인데 Vercel Serverless Function 기본 리전은 `iad1`(US East). 모든 SSR 요청이 (사용자 → ICN edge → IAD lambda → 서울 DB → IAD → ICN → 사용자) 경로를 타며 RTT가 1~2초씩 누적. 사용자는 한국에 한정되어 있어 글로벌 분산 의미 없음.
- **Decision**: 프로젝트 루트에 `vercel.json`을 두고 `{ "regions": ["icn1"] }`로 모든 함수를 서울 리전에 강제. `/api/healthz` 응답 헤더로 `region: icn1` 자동 노출 → ops 검증 용이.
- **Consequences**: SSR 응답 시간 2~3초 → 150~380ms (10~14배 개선). 단, ICN1 리전이 일시적 장애 시 자동 fallback 없음 — 다른 리전으로 옮기려면 수동 변경 필요. Vercel Pro 이상은 multi-region 가능하나 현재 Hobby 플랜은 단일 리전 필수이므로 트레이드오프 자체가 발생하지 않음. 사용자 한정 국내라는 전제가 깨지면(해외 진출) 재검토 필요.
