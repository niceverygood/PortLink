# CLAUDE.md — PortLink 프로젝트 누적 컨텍스트

> 모든 Claude 세션은 첫 응답 전에 이 문서를 정독한다. 누락된 결정·룰·카피·금액 표기 규칙이 있으면 작업을 시작하지 말고 사용자에게 확인한다.

마지막 업데이트: Stage 9-prep (커밋 `b6def1b`)

---

## 1. 프로젝트 정체성

**PortLink** — 국내 컨테이너 트럭(약 25,000대) 시장을 위한 디지털 배차 콜센터 플랫폼.

| 측면        | 내용                                                                          |
| ----------- | ----------------------------------------------------------------------------- |
| 시장        | 한국 내수 (Asia/Seoul) — Vercel 함수 ICN1 단일 리전 강제                      |
| 양면 시장   | 화주/포워더(B2B) ↔ 차주(B2C)                                                  |
| 4 역할      | `admin` · `forwarder` · `carrier` · `driver`                                  |
| 도메인 분리 | 한 Next.js 프로젝트 안에 path 기반 분기                                       |
| 차별화 핵심 | **안전운임 자동 검증·신고 양식 자동 제공** + 안전운임 §14 공차 보상 권리 안내 |

### 1.1 도메인 분리

| 경로           | 앱 이름                    | 디바이스          | 톤               |
| -------------- | -------------------------- | ----------------- | ---------------- |
| `/`            | PortLink 랜딩              | 데스크탑 + 모바일 | 네이비           |
| `/forwarder/*` | PortLink (포워더 웹)       | 데스크탑 우선     | Navy `#0A2540`   |
| `/driver/*`    | PortLink Driver (차주 PWA) | 모바일 전용       | Orange `#FF6B35` |
| `/admin/*`     | 관리자 백오피스            | 데스크탑          | Navy + slate     |
| `/calculator`  | 안전운임 공개 계산기       | 비회원 가능       | 마케팅 톤        |

### 1.2 브랜드 표기

- 영문: `PortLink` (한 단어, P·L 대문자) — 변형 표기 금지
- 한글: `포트링크`
- 차주 앱: `PortLink Driver` / `포트링크 드라이버`

---

## 2. 작업 룰 (모든 Stage 공통)

### 응답 언어

- **모든 응답은 한국어**
- 코드·커밋 메시지·식별자(변수/함수/파일명)는 영어
- 주석은 한국어 OK (도메인 용어가 한국어 기반)

### Stage 진행 패턴

1. 새 Stage 시작 시 사용자가 `[CLAUDE.md 정독 후 Stage N 작업 분해 보여줘]` 형식 명령
2. **시작 전 작업 분해 4~10개를 한국어 번호 매김**으로 보여주기
3. **승인 후에야 진행**
4. 작업 단위마다 prod 검증 (curl/bash 직접) → 커밋·푸시
5. Stage 종료 시 ADR 작성 (의사결정이 있었던 경우만)

### 모호한 메시지 처리

- 가정을 명시한 후 진행. 멈춰서 질문하는 건 다음 경우만:
  - 비즈니스 룰 변경 (정산율, 안전운임 적용 범위 등)
  - 돈 흐름 (가격, 수수료, 청구 주체)
  - 법규 영향 (안전운임, 신고서, PDF 면책 수위)
  - 차주/화주 어느 한쪽에 영업적으로 민감한 카피

### 매 응답 끝

- **다음 권장 작업 1개 제안** (Stage 진행 또는 부수 작업)

### 커밋 메시지 형식

```
[Stage N] <한국어 요약>

<본문 — 변경 내역 / 결정 / 부수 효과>

Co-Authored-By: Claude ...
```

- `[Stage N]`의 N은 **정수** (commitlint 패턴 `^\[Stage \d+\]` 강제)
- 8.1 같은 마이너 작업도 본문에 명시: `[Stage 8] 8.1 ...`

---

## 3. 카피 톤

### 호칭

- **차주 화면**: "차주님"
- **포워더 화면**: "담당자님"
- **관리자 화면**: 호칭 생략 (운영자 입장)

### 절대 금지 단어

- "자동 청구", "자동 신고", "PortLink가 청구합니다" — **법적 회피**
- "당신을 신고합니다" 류 위협적 표현
- "확정 보상", "보장된 금액" — 차주/화주 분쟁 대비

### 권장 패턴

- "PortLink는 ~을 차주님께 알려드립니다"
- "청구 여부는 차주님이 직접 판단하셔서 진행하세요"
- "본 자료는 참고용이며, 책임은 ~ 본인에게 있습니다"
- 마케팅: "**PortLink는 다른 주선사가 알려주지 않던 권리를 차주님께 알려드립니다**"

### 면책 문구 (PDF 머리/중간/꼬리 3곳 박기)

- 머리: "본 자료는 PortLink가 입력 데이터를 기반으로 자동 생성한 참고 자료입니다"
- 중간: 데이터 출처(고시 번호) + 계산 시점 ISO 표기
- 꼬리: "신고 여부와 신고 내용에 대한 책임은 차주(또는 청구인) 본인에게 있으며, PortLink는 어떠한 법적 책임도 부담하지 않습니다"

---

## 4. 표기 규칙

### 금액

- 천단위 콤마 + "원" → `800,000원` (`formatKRW` 헬퍼 사용)
- 모든 금액은 KRW 정수 (Decimal 사용 X)
- DB 컬럼 suffix: `*Krw` (예: `chargeKrw`, `driverPayout`)

### 거리

- km 표기, 소수점 첫째 자리 반올림 (안전운임 제6조 — 네이버지도 측정 규칙과 일치)
- 1km 미만은 `"< 1km"`, 1000km 초과는 그대로
- `formatDistance(meters)` 헬퍼 사용

### 일시

- KST(`Asia/Seoul`) 표시. UTC 저장.
- `toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', ... })`
- ISO 표기는 사후 분쟁 대비 시 (PDF 등)

### 색상

- Navy `#0A2540` — PortLink 메인
- Navy Dark `#061B2E` — 강조
- Orange `#FF6B35` — Driver 메인 / CTA
- Orange Dark `#E55A2B` — hover
- Success `emerald-700` (긍정 상태)
- Error `rose-600` / `brand-error` (위험)
- BoBi 블루 `#1a56db` — 별도 톤이 필요한 시연용 (안전운임 외부 안내 등)
- 그 외 슬레이트 (slate-50 ~ slate-900)

### 폰트

- 기본: **Pretendard** (한글)
- 영문/숫자: **Inter** (또는 Pretendard 영문 글리프)
- PDF: Pretendard Regular/Bold OTF (jsdelivr CDN, `@react-pdf/renderer Font.register`)
- `tabular-nums` 클래스로 숫자 정렬

### 컨테이너 종류 표기

- DB enum: `TWENTY_FT` / `FORTY_FT` / `FORTY_FT_HC` / `FORTY_FIVE_FT`
- wire(@map): `20FT` / `40FT` / `40FT_HC` / `45FT`
- UI: `20FT` / `40FT` / `40HC` / `45FT` (`CONTAINER_TYPE_LABEL`)

---

## 5. 핵심 비즈니스 룰

### 5.1 안전운임 v2 (Stage 8 — ADR 015)

- **고시 출처**: 국토교통부고시 제2026-55호 (시행 2026-02-01 ~ 2026-12-31)
- **연도별 시드 분리**: `prisma/seeds/safe-freight-2026.ts`. 매년 1월 새 고시 발표 → `safeFreight2027.ts` 신규 생성. SOP는 [docs/safe-freight-yearly-update.md](docs/safe-freight-yearly-update.md)
- **운임 3종** (`RateType`):
  - `CONSIGNMENT` 안전위탁운임 (운수사업자 → 차주)
  - `INTER_CARRIER` 운수사업자 간 운임 (재위탁용) — **admin/CARRIER role만 노출**
  - `TRANSPORT` 안전운송운임 (화주 → 운수사업자)
- **가산방식 할증** (제22조):
  - 1순위 100%, 2·3순위 50%씩, **4순위부터 무시**
  - 예: 화약류(100%) + 중량물(80%) + 공휴일(20%) + 심야(20%) → 100 + 40 + 10 = **150%**
- **할증 14종**: REEFER 30% / EXPLOSIVE 100% / RADIOACTIVE 200% / INCHEON_ORIGIN 20% / PYEONGTAEK_ORIGIN 18% / HAZARDOUS 30% / ROUGH_ROAD 20% / NIGHT 20% / HOLIDAY 20% / RESTRICTED_AREA 30% / TANK_CONTAINER 30% / FLEXIBAG_LIQUID 20% / FLEXIBAG_POWDER 10% / DUMP_CONTAINER 25%
- **거리 측정** (제6조):
  - 네이버지도(거리우선, 차종 5종, 4축 이상, 특수화물차)
  - 측정 시각: **오전 06:00** (07:00 아님)
  - 첫째자리 반올림
  - 항만 출발은 **터미널 내 거리 자동 가산** (제35조). 부산북항 3.3km / 부산신항 3.3km / 인천항 1km / 광양항 4km / 평택항 2km 등
- **45FT**: 40FT × 1.125 (제19조). MVP에선 자동 계산
- **환적 컨테이너**: **적용 제외**. `DispatchOrder.shipmentType=TRANSSHIPMENT`면 위젯/PDF 비활성. `shipment_type` 컬럼 자체는 유지 (정책 변경 대비)
- **유효기간 외 호출**: `OUT_OF_EFFECTIVE_PERIOD` 에러
- **유가 연동** (제34조): 분기별 ±50원 변동 시 운임 조정. `FuelPriceAdjustment` 테이블. 시드 데이터 미적재 (Phase 2)

### 5.2 위치 기반 (Stage 8.A~C + 9-prep)

- **백그라운드 GPS 추적 X** (PWA 한계 + 한국 차주 거부감)
- **액션 시점 1회 capture만**: Trip 상태 액션 버튼 클릭 시 `navigator.geolocation.getCurrentPosition()` 1회 (timeout 5초)
- **권한 거부/타임아웃 시 best-effort**: 액션은 정상 진행, 좌표만 미저장
- **저장**: `TripLocationStamp { tripId, action, lat, lng, accuracyM, capturedAt }` — `(tripId, action)` unique
- **§14 공차 보상**:
  - **자동 청구 X. 양식만 제공.** 차주가 직접 화주/운수사에 PDF 들고 발송
  - 보상액 = 안전위탁운임 × 50% (십원 단위 반올림)
  - 임계: 직전 trip 종료 좌표 vs 새 trip 출발지 거리 ≥ 10km
  - **GPS spoofing 1차 가드**: 직전 stamp 시점 → 현재 평균속도 비현실(10분 < 시간 + 50km < 거리)이면 §14 적용 skip + AuditLog
  - funnel 단계 (`EmptyRunChargeStatus`): `DETECTED` → `NOTICE_SHOWN` → `PDF_DOWNLOADED`. 후속 CLAIMED/PAID는 Phase 2에서 차주 수동 입력

### 5.3 정산 (Stage 5 — ADR 011)

- **수수료**: 5% (런칭 — `BUSINESS_RULES.PLATFORM_FEE_RATE`)
- **안전운임 한도**: 10% (`LEGAL_MAX_BROKERAGE`). 90% 미만 입력 시 강제 차단. 90~100% 사이는 인라인 경고 + 인지 동의 체크박스 (자동 알림 X)
- **불변식**: `driverPayout + platformFee = fare` (DB CHECK 제약)
- **Settlement 자동 생성**: Trip COMPLETED 전환과 같은 트랜잭션에서 `status=DRAFT` 생성 + DispatchOrder COMPLETED 갱신 (ADR 007)
- **확정 발행**: 포워더가 `/forwarder/settlement`에서 "확정 발행" 클릭 → `CONFIRMED` + TaxInvoice 자동 (시퀀셜 invoiceNo)
- **PAID는 Stage 6/7에서 결제 통합 시점에 추가**

### 5.4 PDF 생성 (Stage 8)

- **라이브러리**: `@react-pdf/renderer` v4 (Vercel Lambda 호환)
- **폰트**: Pretendard Regular/Bold OTF — jsdelivr CDN (`Font.register`). cold start 1회 fetch 비용 ~200ms
- **server-only dynamic import**: `next.config.mjs` 미설정 (server Component에서만 사용)
- **3종 PDF 모두 면책 머리/중간/꼬리**:
  - `FreightInvoicePdf` — 포워더 청구서 (안전운송운임 기준)
  - `NonpaymentReportPdf` — 차주 미지급 신고서
  - `EmptyRunClaimPdf` — 차주 §14 공차 청구 양식 (체크박스 + 청구일/서명란)
- 다운로드 패턴: `POST /api/freight/{invoice|report}/[id]` body `{format:"pdf"}` 또는 `GET /api/driver/empty-run/[id]/pdf` → `application/pdf` 바이너리 + `Content-Disposition`

---

## 6. RBAC

| 기능                                            | admin    | forwarder | carrier | driver   |
| ----------------------------------------------- | -------- | --------- | ------- | -------- |
| `/admin/*` 접근                                 | ✓        | ×         | ×       | ×        |
| `/forwarder/*` 접근                             | ✓        | ✓         | ×       | ×        |
| `/driver/*` 접근                                | ✓        | ×         | ×       | ✓        |
| 본인 발주 dispatch                              | ✓ (전체) | ✓ (본인)  | ×       | ×        |
| 본인 trip                                       | ✓ (전체) | ×         | ×       | ✓ (본인) |
| INTER_CARRIER 운임 응답                         | ✓        | ×         | ✓       | ×        |
| 청구서 PDF (`/api/freight/invoice`)             | ✓        | ✓ (본인)  | ×       | ×        |
| 신고서 PDF (`/api/freight/report`)              | ✓        | ×         | ×       | ✓ (본인) |
| §14 공차 PDF (`/api/driver/empty-run/[id]/pdf`) | ✓        | ×         | ×       | ✓ (본인) |
| 이상거래 룰 6종                                 | ✓        | ×         | ×       | ×        |
| Trip 강제 취소                                  | ✓        | ×         | ×       | ×        |
| 회원 승인/정지                                  | ✓        | ×         | ×       | ×        |
| AuditLog 열람                                   | ✓        | ×         | ×       | ×        |

### 인증 분리 (ADR 005)

- middleware (Edge): `src/lib/auth/edge.ts` — 베이스 NextAuth만 (Prisma 없음)
- API/Server Component: `src/lib/auth/index.ts` — 풀 NextAuth
- Credentials providers는 `src/lib/auth/config.ts`에서 정의

---

## 7. 디렉토리 + 명명

```
src/
├── app/
│   ├── (auth)/login/         # 로그인 (kind 파라미터로 driver/forwarder/admin 분기)
│   ├── (auth)/signup/        # 가입 (driver/forwarder/carrier)
│   ├── admin/                # 관리자 4페이지
│   │   ├── dashboard/
│   │   ├── dispatches/
│   │   ├── users/
│   │   ├── anomaly/          # 이상거래 6룰
│   │   └── sentry-test/
│   ├── forwarder/            # 포워더 웹
│   │   ├── dashboard/
│   │   ├── dispatch/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── settlement/
│   │   ├── drivers/
│   │   ├── documents/
│   │   └── settings/
│   ├── driver/               # 차주 PWA (모바일 전용)
│   │   ├── jobs/[id]/
│   │   ├── trip/[id]/
│   │   ├── settlement/
│   │   ├── report/          # 미지급 신고
│   │   └── me/
│   ├── calculator/           # 공개 운임 계산기
│   └── api/
│       ├── auth/             # NextAuth + OTP
│       ├── notifications/    # 알림 (Stage 7)
│       ├── freight/          # 안전운임 v2 5 endpoint
│       ├── driver/           # 차주 전용 (nearby-open, empty-run/...)
│       ├── healthz/          # shallow (Edge)
│       └── healthz/deep/     # DB ping + 5s cache
├── components/
│   ├── ui/                   # shadcn (Button, Input, Dialog, ...)
│   ├── portlink/             # 도메인 위젯 (PortBadge, ContainerTypeIcon, TripStatusBadge, ...)
│   ├── forwarder/            # Topbar, KpiCard
│   ├── driver/               # BottomTabs, ServiceWorkerRegister
│   └── notifications/        # NotificationBell
├── lib/
│   ├── auth/
│   ├── db.ts                 # PrismaClient singleton
│   ├── result.ts             # Result<T,E> + ApiResult<T>
│   ├── format.ts             # formatKRW
│   ├── distance.ts           # Haversine + formatDistance
│   ├── geolocation.ts        # captureLocationOnce wrapper
│   ├── trip-state.ts         # TripStatus 전이 머신
│   ├── trip-update.ts        # status 업데이트 도메인
│   ├── dispatch-accept.ts    # 배차 수락 도메인
│   ├── settlements.ts        # 정산 계산
│   ├── empty-run.ts          # §14 공차 보상
│   ├── anomaly.ts            # 이상거래 6룰
│   ├── notifications.ts      # 알림 생성
│   ├── safe-freight/
│   │   ├── calculator.ts     # 별첨 계산 엔진
│   │   ├── queries.ts        # 현재 스냅샷 조회
│   │   ├── invoice-data.ts   # 청구서/신고서 빌더
│   │   └── pdf-templates.tsx # 3종 PDF 컴포넌트
│   └── prisma-enums.ts       # @map ↔ identifier 매핑
├── config/
│   ├── business-rules.ts     # 단일 진실의 원천 (수수료, 한도, 항만 등)
│   ├── regions.ts            # 30 시군구 + 안전운임 더미 (deprecated 일부)
│   └── geocoords.ts          # 5 항만 + 30 시군구 좌표 (Phase 2까지 대체)
├── instrumentation.ts        # Next.js 진입점 — Sentry register
└── middleware.ts             # Edge 인증 가드

prisma/
├── schema.prisma
├── migrations/               # 모든 마이그레이션
├── seed.ts                   # 메인 시드
└── seeds/
    ├── safe-freight-2026.ts  # 연도별 (2027부터 신규 파일)
    └── safe-freight-seeder.ts

docs/
├── decisions/                # ADR 001~015
├── demo-scenario.md          # 12~15분 시연 스크립트
├── deployment-domain.md      # portlink.kr DNS 등록 절차
└── safe-freight-yearly-update.md # 매년 1월 갱신 SOP

loadtest/
├── healthz.js                # 100 RPS × 5min Edge baseline
├── login-page.js             # 200 RPS × 5min CDN baseline
└── RESULTS.md
```

### 명명 규칙

- React 컴포넌트: PascalCase (`SafeFreightVerifier`, `JobCard`)
- 훅: `useXxx`
- 헬퍼/유틸: camelCase
- API route 파일: `route.ts`
- 페이지 파일: `page.tsx`
- Server Action 파일: `actions.ts`
- Client component: 파일 첫 줄에 `'use client'`
- DB 컬럼: snake_case (`@map("created_at")`)
- Prisma model: PascalCase
- 환경변수: SCREAMING_SNAKE_CASE

---

## 8. 테스트 정책

### Vitest 우선 (Jest 사용 X)

- `tests/unit/*.test.ts` — DB 무관 단위 테스트
  - `npm test` → CI에서도 통과 보장
  - 안전운임 계산 (8 케이스), format, trip-state, enum-consistency
- DB 통합 테스트 (queries, anomaly, concurrency, integrity)
  - `docker compose up -d postgres` 필요
  - 시드 데이터 `D26-0001~D26-0058` 의존
- E2E (`tests/e2e/`) — Playwright. `playwright.config.ts` `workers: 1` (OTP cooldown 충돌 회피)

### Prod 검증

- 모든 Stage 종료 시 **curl/bash로 직접 prod 검증** 필수
- 패턴:
  ```bash
  curl -s -X POST https://port-link-snowy.vercel.app/api/... \
    -H 'content-type: application/json' -d '{...}'
  ```
- 인증 필요 라우트는 미인증 401 응답 형식만 확인 (실제 흐름은 사용자가 브라우저에서)
- 부하 테스트는 `loadtest/` 스크립트 docker 실행

### 빌드/린트 게이트

- `npm run typecheck && npm run lint && npm run build` — 모두 통과해야 푸시
- husky + lint-staged가 commit 시점에 eslint --fix + prettier --write
- commitlint: `^\[Stage \d+\]` 강제

---

## 9. 운영 환경

### 호스팅

- **Vercel** Hobby plan + `vercel.json` `regions: ["icn1"]` (ADR 014)
- **Supabase** 무료 티어 PostgreSQL 16, ap-northeast-2
  - DATABASE_URL: pooler 6543 + `?pgbouncer=true`
  - DIRECT_URL: 5432 (마이그레이션용)
- **Sentry** 무료 티어 (ADR 013)
  - `tracesSampleRate: 0.1`, replay 0%/10%, tunnelRoute `/monitoring`

### 환경변수

| 변수                                                  | 용도                                            |
| ----------------------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL`                                        | Prisma 풀러 연결                                |
| `DIRECT_URL`                                          | 마이그레이션 직접 연결                          |
| `AUTH_SECRET`                                         | NextAuth JWT                                    |
| `AUTH_URL`                                            | 도메인 (portlink.kr 또는 vercel 기본)           |
| `SEED_PASSWORD`                                       | 시드 사용자 비밀번호 + 1-Click 로그인 활성 토글 |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`               | Sentry                                          |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | sourcemap 업로드 (선택)                         |

### 보안 헤더 (next.config.mjs)

- `Strict-Transport-Security` (Vercel 자동)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

### 성능

- 정적/Edge: 130~200ms (warm)
- Lambda warm: 150~400ms
- Lambda cold: 500~700ms (Hobby 한계)
- `/login` 200 RPS × 5min 0% 에러, p95 23ms (loadtest/RESULTS.md)
- `/api/healthz` 100 RPS × 5min 0% 에러, p95 49ms

### 캐싱 전략 (Stage 8 perf)

- NotificationBell 폴링 90초 + visibility hidden 시 정지
- dispatch list `unstable_cache` 30초 (auth는 매번)
- 차주 jobs/[id] verifier는 client-side lazy (SSR JOIN 절약)
- `/api/healthz/deep` 5초 in-memory 캐시

---

## 10. Stage 0 첫 명령 (그대로 박제 — 새 세션 시 사용)

```
CLAUDE.md를 정독하고 Stage N 작업 분해를 보여줘.
승인 후 진행할게. 작업은 4~10개로 나누고 한국어 번호 매김으로.
시작 전 현재 디렉토리 상태(`ls -la`, `git status`)도 함께 알려줘.
```

---

## 11. 누적 결정 로그

### Stage 별 요약

| Stage  | 핵심 산출                                                                       |
| ------ | ------------------------------------------------------------------------------- |
| 0      | Next.js 14 + Tailwind + Prisma 셋업, OrbStack arm64, Postgres 5433              |
| 1      | 도메인 모델 12개 + 시드 (안전운임 450 / 사용자 8 / 배차 3)                      |
| 2      | Auth.js v5 (이메일+비밀번호, 휴대폰 OTP) + 역할 가드                            |
| 3      | 핵심 도메인 API 6종 + 동시성 락 + E2E                                           |
| 4      | 차주 모바일 PWA 6 페이지 + manifest/SW                                          |
| 5      | 포워더 웹 6 페이지 + DataTable + 정산 발행                                      |
| 6      | 관리자 백오피스 4 페이지 + 이상거래 4룰 + 회원 승인                             |
| 7      | 운영 준비 — Vercel + Supabase + Sentry + k6 + 알림 + 1-Click 로그인 + 보안 헤더 |
| 8      | 안전운임 v2 (5 모델) + 계산 엔진 + 5 API + 위젯 + PDF 3종 + 공개 계산기         |
| 8.A~C  | 차주 위치 스탬프 + 거리 매칭 + §14 공차 자동 감지                               |
| 9-prep | EmptyRunCharge UX 안전화 + GPS spoofing 1차 가드                                |

### ADR 목록

| ID  | 제목                          | 핵심 결정                                                     |
| --- | ----------------------------- | ------------------------------------------------------------- |
| 001 | Prisma v6                     | MVP 안정성 우선 v6.19.3                                       |
| 002 | Postgres host port 5433       | 호스트 5432 충돌 회피                                         |
| 003 | OrbStack arm64                | Intel-only DMG 회피                                           |
| 004 | Prisma enum mapping           | identifier(`FORTY_FT_HC`) ↔ wire(`40FT_HC`) 매핑 헬퍼 1곳     |
| 005 | Auth edge split               | `lib/auth/{edge,index}.ts` 분리 (middleware는 Edge만)         |
| 006 | DispatchAssign partial unique | `WHERE cancelled_at IS NULL` partial index — P2002로 1명 승리 |
| 007 | Settlement on completion      | Trip COMPLETED 트랜잭션 안에서 즉시 생성                      |
| 008 | Driver server actions         | mutation은 Server Action, query는 server Component            |
| 009 | PWA manual SW                 | next-pwa 의존성 회피                                          |
| 010 | TanStack Table + Query        | 포워더 admin DataTable + caching                              |
| 011 | Settlement issue flow         | DRAFT → 포워더가 "확정 발행" → CONFIRMED + TaxInvoice 자동    |
| 012 | Admin role model              | 단일 ADMIN role + AuditLog 자동 기록                          |
| 013 | Sentry 채택                   | `@sentry/nextjs` v10 + tracesSampleRate 0.1 + replay on-error |
| 014 | Vercel ICN1 강제              | iad1 → icn1 → SSR 2~3s → 150~380ms                            |
| 015 | 안전운임 v2                   | 거리 기반 + 연도별 스냅샷 + 5 신규 모델, SafeRate deprecated  |

### 안전운임 v2 결정 9개 (Stage 8 시작 합의)

1. **환적**: 제외 (정책. `shipment_type` 컬럼은 유지해 변경 대비)
2. **네이버지도 API**: Phase 2 연기. 사용자 km 직접 입력 + "네이버지도에서 확인" 외부 링크
3. **신고서 면책 문구**: 강하게 (PDF 머리/중간/꼬리 3곳)
4. **포워더 자동 경고**: OFF — 인라인 경고 + 인지 동의 체크박스만 (자동 알림 X)
5. **운수사업자 간 운임 UI**: admin + carrier role만 노출
6. **2027 갱신 SOP**: `docs/safe-freight-yearly-update.md` 문서화
7. **기존 SafeRate**: 병존 (`@deprecated` 표기) → Stage 9에서 제거
8. **`ContainerType.FORTY_FIVE_FT`**: 추가. `FORTY_FT_HC`는 유지 (안전운임 동치)
9. **PDF 라이브러리**: `@react-pdf/renderer` + Pretendard CDN

### Stage 9-prep 추가 결정 (EmptyRunCharge UX 안전화)

10. **§14 자동 청구 X**: PortLink는 양식만 제공. 차주가 직접 화주/운수사에 발송
11. **카피**: "보상 청구 가능액" → "안전운임 §14에 따라 ... 청구하실 권리가 있습니다"
12. **GPS spoofing 가드**: 직전 stamp 시점 → 현재 평균속도 비현실(10분 < 시간 + 50km < 거리)이면 §14 skip + AuditLog. anomaly Rule 6에 trip 안 stamp 점프 검사

### 마이그레이션 정리 예정 (Stage 9+)

- `SafeRate` 모델 제거 + 기존 시드 삭제 + 의존 코드(`config/regions.ts CONTAINER_TYPE_COEFFICIENT 일부`) 정리
- `EmptyRunCharge`에 `CLAIMED` / `PAID` 후속 status 추가 (차주 수동 입력)
- 네이버지도 Directions API 정식 연동 → `DispatchOrder.distanceKm` 컬럼 추가
- 청구서 PDF 다운로드 버튼을 admin 페이지에도 노출
- `FuelPriceAdjustment` 분기별 시드 데이터 적재 (현재는 스냅샷만 있음)

---

## 12. 빠른 참조

### 1-Click 테스트 로그인 (`SEED_PASSWORD` 설정 시 활성)

- 관리자: `admin@portlink.kr`
- 포워더: `kim@hanjin-demo.kr` (한진로지스틱스)
- 운송사: `kim@inhouse-demo.kr`
- 차주: `D-0001` ~ `D-0005` (휴대폰 `010-3000-0001` 등)

### 시드 규모 (prod 적재)

- 안전운임 v2 매트릭스 6,600 row
- 사용자 24명 / 차량 15대 / 배차 58건 (다양한 상태)
- 알림 88건 / 감사로그 8건

### 자주 참조하는 도메인 헬퍼

- `calculateSafeFreight(input)` — 운임 계산 (별첨 계산 엔진)
- `buildInvoiceData({ dispatchOrderId, overrideDistanceKm? })` — 청구서/신고서 데이터 빌더
- `detectAndRecordEmptyRun({ driverId, newTripId, ... })` — §14 자동 감지
- `runAllAnomalyRules()` — 이상거래 6룰 일괄
- `captureLocationOnce()` — geolocation 1회 best-effort
- `haversineMeters(lat1, lng1, lat2, lng2)` — 거리 계산
- `apiOk(data)` / `apiErr(code, message)` — API 응답 형식

### API Result 패턴 (절대 변경 X)

```ts
// 성공
{ ok: true, data: T }
// 실패
{ ok: false, error: { code: string, message: string } }
```

### 도메인 함수 Result 패턴

```ts
// src/lib/result.ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

도메인 로직은 throw 대신 Result 반환. API route에서 `apiOk`/`apiErr`로 변환.

---

## 13. 다음 권장 작업 (현재 시점)

- [ ] Stage 9 본 작업: `SafeRate` deprecated 모델 정식 제거 + 마이그레이션
- [ ] portlink.kr 도메인 연결 (DNS 레코드 등록 — 사용자 작업)
- [ ] Sentry `SENTRY_AUTH_TOKEN` 등록해 sourcemap 업로드 활성
- [ ] `EmptyRunCharge`에 `CLAIMED` / `PAID` 추가 (차주 수동 입력 form)
- [ ] 네이버지도 Directions API 정식 연동 (Phase 2)
