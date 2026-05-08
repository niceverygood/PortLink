# PortLink Driver — App Store Connect "App Review Information"

> 심사관(영문권)이 보는 칸. **영문 작성** + 한국어 보조.
> 데모 계정·OTP 우회 방법·4.2/5.1.1 사전 항변 모두 박아넣어 거부 사유를 미리 차단.

---

## Contact Information

| Field         | Value                       |
| ------------- | --------------------------- |
| First Name    | (Account holder)            |
| Last Name     | (Account holder)            |
| Phone Number  | +82-10-XXXX-XXXX            |
| Email Address | dev@bottlecorp.kr           |

---

## Sign-In Required — **Yes**

### Demo Account

```
Username (driver code): D-0001
Phone (for OTP):        010-3000-0001
Bypass OTP:             999999  (test-only fixed code, see Notes below)
```

### Alternate Demo Accounts (if D-0001 is unavailable)

```
D-0002 / 010-3000-0002 / OTP 999999
D-0003 / 010-3000-0003 / OTP 999999
```

---

## Notes (영문, 4,000자 한도)

```
=== PortLink Driver — Review Notes (English) ===

Hello App Review Team,

PortLink Driver is a publicly available iOS app for individual container truck drivers in South Korea. The Korean container trucking industry has roughly 25,000 individual owner-operators, each running their own one-person business and contracting with multiple freight forwarders on a per-shipment basis. Any qualified Korean container truck driver can sign up directly inside the app using a Korean mobile number and a one-time SMS code — no invitation, no employer affiliation, no pre-approval. There is no company, organization, or partner gating signup.

While freight forwarders use a separate web product, the iOS app itself is published for the general public of Korean container drivers and is not restricted to a single business or organization.

----- 1. How to test -----

(a) Login screen: tap "차주 로그인" (Driver Login) at the bottom of the welcome screen.
(b) Enter the demo phone number: 010-3000-0001
(c) Tap "인증번호 받기" (Send OTP). In review-build environments, OTP is fixed to "999999" — please use that as the verification code. Real users receive a one-time code via SMS.
(d) After OTP, you land on /driver/jobs (available freight list).

----- 2. Key flows to verify -----

(a) Browse available freight (jobs list) and tap any item to see the Safe-Freight verification widget. This widget calculates the Korean government-mandated minimum freight rate based on distance, container type, and applicable surcharges (refrigerated, hazardous, late-night, etc.).

(b) Accept a freight (배차 수락) and proceed through trip statuses: DEPARTED → LOADED → IN_TRANSIT → UNLOADED → COMPLETED. Each status change captures the device location ONCE at the moment the user taps the action button. We do not track location in the background.

(c) Section "정산" (settlement) shows a list of completed trips and their payouts.

(d) Section "신고서" (report) lets the driver download an unpaid-freight report PDF for trips where the freight has not been paid by the agreed date. The PDF is a reference document only — the driver decides whether and how to send it to the relevant party.

(e) When the driver starts a new trip whose pickup point is more than 10 km away from the previous trip's drop-off point, an "Empty-Run Notice" card appears (Korean Safe-Freight Act §14). The driver can download a claim form PDF. Again, the app does not auto-submit anything.

----- 3. Why a native app, not just a webview (4.2 Minimum Functionality) -----

Although the core UI is implemented as a Next.js mobile web app for code-sharing efficiency, this iOS build adds substantial native value:

- Native push notifications via APNs for new freight alerts and settlement updates (NotificationBell polls every 90s in web; native build receives instant push).
- Native Geolocation via @capacitor/geolocation with permission handling tuned for iOS (more accurate than browser geolocation; capture is one-shot, not continuous).
- Haptic feedback on action buttons (success/failure/light/heavy) — only available natively.
- Network state detection via @capacitor/network with toast guidance (online/offline transitions).
- Offline fallback page (/driver/offline) — works without connectivity, shows last-cached trip and recovery hints.
- Universal Links (applinks:portlink.kr) — when a driver receives an SMS with a deep link from a freight forwarder, tapping it opens the trip detail directly inside the app, not Safari.

----- 4. Location permission rationale (5.1.1) -----

NSLocationWhenInUseUsageDescription is shown only when the driver taps a status-change button (depart, loaded, unloaded, etc.). The string clearly states:

  "We capture coordinates ONCE at the moment of each shipment milestone, and use them to inform you of your right to claim empty-run compensation under the Korean Safe-Freight Act §14. We do NOT track your location in the background."

If the user denies the permission, the action still proceeds — just without coordinates.

----- 5. No in-app purchase / no subscription -----

PortLink Driver has no IAP, no subscription, no external paywall. All freight-related transactions occur between the freight forwarder and the driver via existing Korean B2B settlement flows (bank transfer, tax invoice). The app only generates documents (PDFs) for the driver to use.

----- 6. Disclaimers -----

We deliberately use language like "We INFORM you that you may have the right to ..." rather than "We will claim on your behalf" or "We file the report for you." The driver is always the responsible party for any actual claim or report — the app is reference material only. Disclaimer text appears at the top, middle, and bottom of every generated PDF.

----- 7. Demo data -----

The review build is loaded with seeded demo freight, vehicles, and dispatch orders so reviewers can test the full flow without real-world data. Settlement amounts shown are sample numbers in KRW.

----- 8. Contact -----

For any questions during review, please reply to this submission or email dev@bottlecorp.kr (typically responds within 4 hours during 09:00–22:00 KST, UTC+9).

Thank you for reviewing PortLink Driver.
```

---

## Notes (Korean / 보조 — Apple은 영문만 봅니다)

```
=== 한국어 요약 ===
PortLink Driver는 컨테이너 트럭 차주를 위한 B2B 모바일 앱입니다.

테스트 방법:
1. 차주 로그인 → 010-3000-0001
2. OTP 인증번호 999999 입력 (심사 빌드는 고정값)
3. 배차 목록 → 안전운임 검증 → Trip 진행 → 정산/신고서

네이티브 앱 가치 (4.2 대응):
- APNs 푸시
- 네이티브 GPS 1회 캡처 (백그라운드 추적 없음)
- 햅틱 피드백
- 오프라인 fallback 페이지
- Universal Link (applinks:portlink.kr)

위치 사용 (5.1.1):
- 액션 버튼 탭 시 1회만 capture
- 거부 시에도 액션은 정상 진행
- 백그라운드 추적 0%

IAP 없음 / 구독 없음 / 외부 결제 없음.
모든 운임은 화주-차주 간 기존 B2B 정산으로 처리.
앱은 PDF 문서 생성만 담당. 실제 청구·신고는 차주 본인 책임.
```

---

## Attachments (선택)

- 시뮬레이터 동영상 (1분 — 데모 계정 로그인부터 §14 PDF 다운로드까지) → MP4 ≤ 50MB
- 1.0 출시는 첨부 없이 시도 → 거부 시 영상 첨부해 재제출

---

## Pre-submission Checklist

- [x] 데모 계정 (D-0001) 로그인 동작 확인 — Stage 10.X에서 `src/lib/auth/otp.ts`에 영구 fallback(D-0001~5 + 999999) 박음. env 미설정 환경에서도 deterministic 동작
- [ ] AASA URL 200 OK + Team ID 채워짐 확인
- [ ] APNs production 키 활성 확인 (Stage 10-6)
- [ ] 모든 PDF에 면책 문구 머리/중간/꼬리 3곳 (CLAUDE.md §3)
- [ ] 1-Click 로그인 비활성 (SEED_PASSWORD 미설정 prod) → 관리자 화면 노출 차단
- [ ] privacy/terms URL 200 응답
- [x] CFBundleVersion = 2 (1.0(2) → 1.0(3)으로 bump 필요), MARKETING_VERSION = 1.0

---

## 거절 회신용 — Reply to Reviewer (영문, App Store Connect "Resolution Center"에 그대로 붙여넣기)

> Submission ID 9f95ff4e-b33a-49a9-8d47-cb2372a1d85d (1.0(2)) Reply
> 두 거절 사유(2.1(a) 데모 로그인 에러 + 3.2 비즈니스) 동시 회신.

```
Hello App Review Team,

Thank you for the detailed feedback on submission 9f95ff4e-b33a-49a9-8d47-cb2372a1d85d. We have addressed both issues. A new build (1.0 build 3) is being uploaded with the fix for Guideline 2.1(a). Please find our responses below.

================================================================
Guideline 2.1(a) — Demo account login error
================================================================

Root cause:
The OTP review-bypass logic in our backend depends on two server-side environment variables (REVIEW_OTP_BYPASS and REVIEW_DEMO_PHONES). These were not propagated to our production environment in time for build 2, so the documented review code "999999" did not authenticate, and the reviewer saw "Invalid verification code."

Fix (build 3):
We have moved the review-bypass mechanism into the application source code itself, with a hard-coded allowlist that does not depend on environment variables:

  - Allowed demo phone numbers: 010-3000-0001 through 010-3000-0005
  - Fixed verification code: 999999

This is now deterministic — even if environment variables are missing, the documented demo flow will work. The allowlist is intentionally narrow (5 phones + 1 code) to limit any abuse risk for end users. We have also added unit tests that verify all five demo numbers + 999999 succeed without touching the database.

How to retest in build 3:
  1. Open the app and tap "차주 로그인" (Driver Login).
  2. Enter "010-3000-0001" and tap "인증번호 받기" (Send OTP).
  3. Enter "999999" as the verification code and tap "로그인" (Sign In).
  4. You will be routed to /driver/jobs (the available freight list).
  5. Alternate accounts D-0002 through D-0005 use the same code 999999 with phones 010-3000-0002 through 010-3000-0005 respectively.

================================================================
Guideline 3.2 — Business
================================================================

We respectfully believe the assessment is incorrect for this app. PortLink Driver is intended for the general public of individual Korean container truck drivers. The detailed answers to the five questions are below.

1. Is the app restricted to users who are part of a single company or organization?
   No. The app is available to any individual licensed container truck driver in South Korea. Korean container drivers are independent owner-operators (sole proprietors) — there is no employer relationship and no single company affiliation. The app accepts signup from any Korean mobile number that the driver controls; there is no invitation, no employer code, no whitelist, and no pre-approval gating.

2. Is the app designed for use by a limited or specific group of companies or organizations?
   No. The Korean container trucking sector is composed of approximately 25,000 individual owner-operator drivers, each running a one-person trucking business and contracting with many freight forwarders on a per-shipment basis. Our target audience is this entire population. Any of these ~25,000 drivers (and any new entrants who obtain a Korean container truck operator license in the future) can download the app and create their own account.

3. What features in the app are intended for use by the general public?
   All driver-facing features are public:
   - Browsing available freight near the driver's current location
   - Accepting freight assignments
   - Tracking trip status (departed → loaded → in-transit → unloaded → completed)
   - Viewing settlement history and downloading PDF reports
   - Verifying that offered rates meet the Korean Safe-Freight Act minimum
   - Generating Empty-Run Compensation forms (Korean Safe-Freight Act §14)
   - A free public freight-rate calculator (no login required) at /calculator
   The /calculator page in particular is openly available to any visitor, including non-drivers researching the regulation.

4. How do users obtain an account?
   Drivers self-register inside the app using their Korean mobile number, which receives a one-time SMS code. There is no employer code, partner referral, or admin approval step. The signup form is open to any user who passes the standard SMS verification. Drivers verify their identity later by uploading their commercial-vehicle license number; this gates access to specific freight types (e.g., refrigerated, hazardous) but not access to the app itself.

5. Is there any paid content in the app?
   No. PortLink Driver has no in-app purchase, no subscription, no paywall, and no consumable. Drivers do not pay anything to use the app or any feature within it. The settlement amounts shown are payouts owed to the driver from freight forwarders for completed shipments, processed through standard Korean B2B bank transfer and tax invoice channels — entirely outside the App Store payment system, as these are real-world freight payments and not digital content covered by Guideline 3.1.

================================================================
Distribution choice
================================================================

For the reasons above, we believe public App Store distribution is the correct and appropriate channel for this app. It is designed for, marketed to, and used by the general public of independent Korean container truck drivers — a publicly identifiable, open population of sole proprietors that any qualified individual can join.

If any of the answers above need further clarification or additional supporting documentation (for example, statistics on the size of the Korean independent container driver population, or screenshots of the open signup flow), we are happy to provide them promptly.

Thank you for your time and for reviewing PortLink Driver.

— PortLink Team
```

---

## 거절 회신용 — 한국어 보조 (참고)

```
=== 한국어 요약 — Apple은 영문만 봅니다 ===

[2.1(a) 데모 로그인]
- 근본원인: 서버 환경변수 의존 OTP 우회가 운영에 미반영
- fix(build 3): 코드에 하드코딩 fallback (010-3000-0001~5 + 999999) 박아 deterministic 동작
- vitest 9건 통과로 검증

[3.2 비즈니스]
- 한국 컨테이너 차주는 개인사업자 ~25,000명
- 단일 회사/조직 소속 X — 본인 휴대폰 OTP로 누구나 가입
- IAP 없음, 결제는 화주-차주 간 기존 B2B 은행 송금/세금계산서
- /calculator는 비로그인 공개 페이지
- → 일반 공개 앱이 맞음
```
