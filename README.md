# PortLink — 컨테이너 운송 배차 플랫폼

국내 컨테이너 트럭(약 25,000대) 시장을 위한 디지털 배차 콜센터 플랫폼.
한 Next.js 프로젝트 안에 두 앱이 path 기반으로 분기됩니다.

- `/forwarder/*` — **PortLink** (포워더·화주 웹, 데스크탑 우선)
- `/driver/*` — **PortLink Driver** (차주 모바일 PWA)
- `/admin/*` — 관리자 백오피스

상세 스펙은 `CLAUDE.md` 참조.

## 셋업

```bash
# 1. 의존성
npm install

# 2. 환경 변수
cp .env.example .env

# 3. PostgreSQL (Docker Desktop / OrbStack 실행 후, host 5433 → container 5432)
npm run db:up

# 4. Prisma 마이그레이션 + 클라이언트 생성
npm run prisma:migrate
npm run prisma:generate

# 5. 개발 서버
npm run dev
```

`http://localhost:3000` 접속 → 랜딩에서 포워더/차주 진입.

## 스크립트

| 명령                        | 설명                     |
| --------------------------- | ------------------------ |
| `npm run dev`               | 개발 서버 (Next.js)      |
| `npm run build`             | 프로덕션 빌드            |
| `npm run lint`              | ESLint                   |
| `npm run typecheck`         | TypeScript strict 검사   |
| `npm run format`            | Prettier 자동 포맷       |
| `npm test`                  | vitest 단위 테스트       |
| `npm run test:e2e`          | Playwright E2E           |
| `npm run db:up` / `db:down` | 로컬 PostgreSQL 컨테이너 |
| `npm run prisma:migrate`    | DB 마이그레이션 (개발)   |
| `npm run prisma:studio`     | Prisma Studio GUI        |

## 스택

Next.js 14 · TypeScript strict · Tailwind + shadcn/ui · Prisma 6 · PostgreSQL 16 · Pretendard · vitest · Playwright

## 브랜드

- 영문: `PortLink` (한 단어, P·L 대문자) — 변형 표기 금지
- 한글: `포트링크`
- 차주 앱: `PortLink Driver` / `포트링크 드라이버`

색·폰트·문구 규칙은 `CLAUDE.md §1` 참조.

## 개발 컨벤션

- 커밋: `[Stage N] <한국어 요약>` 또는 conventional commits (`feat:`, `fix:` ...)
- 모든 도메인 로직은 `Result<T, E>` 반환 (`src/lib/result.ts`)
- 모든 화폐는 정수 KRW (`src/lib/format.ts`)
- 모든 컴포넌트는 Tailwind 토큰 사용 (hex 직접 입력 금지)
- 비즈니스 룰은 `src/config/business-rules.ts` 한 곳에서만
