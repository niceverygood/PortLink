# 005 — Auth.js v5 config 2-파일 분리 (Edge-safe / Node-full)

- **Context**: middleware는 Edge runtime에서 동작 — Prisma/argon2 같은 native·Node 전용 모듈을 import 하면 빌드 실패. 한편 API 라우트는 Node 환경이라 풀 provider 동작 필요.
- **Decision**: `src/lib/auth/config-base.ts`(콜백·세션·페이지만) + `src/lib/auth/config.ts`(베이스 + Credentials providers) 분리. middleware는 `src/lib/auth/edge.ts`(베이스 NextAuth)만 import. API 라우트와 서버 컴포넌트는 `src/lib/auth/index.ts`(풀 NextAuth) import.
- **Consequences**: provider 추가 시 `config.ts`만 수정. JWT 콜백 변경 시 `config-base.ts`만 수정 → 양쪽 자동 반영. middleware는 토큰 클레임만 보고 분기, DB 호출 0회 (성능 + Edge 호환).
