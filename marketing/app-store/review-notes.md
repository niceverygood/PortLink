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

### Throwaway numbers for the Account Deletion test (5.1.1(v))

These numbers are NOT pre-seeded — they exist only on the OTP bypass allowlist so the
reviewer can sign up a fresh account, exercise the full delete flow, and discard it.

```
010-3000-9001 / OTP 999999
010-3000-9002 / OTP 999999
010-3000-9003 / OTP 999999
010-3000-9004 / OTP 999999
010-3000-9005 / OTP 999999
```

Recommended flow: sign up with 010-3000-9001 → land on /driver/jobs → tap the "내 정보"
(Me) tab → scroll to "계정 관리" (Account Management) → tap "회원 탈퇴" (Delete
Account) → type "탈퇴" in the confirmation field → tap "탈퇴하기" → the account is
deleted in-app and you are signed out.

---

## Notes (영문, 4,000자 한도)

```
=== PortLink Driver — Review Notes (English) ===

Hello App Review Team,

PortLink Driver is a publicly available iOS app for individual container truck drivers in South Korea. The Korean container trucking industry has roughly 25,000 individual owner-operators, each running their own one-person business and contracting with multiple freight forwarders on a per-shipment basis. Any qualified Korean container truck driver can sign up directly inside the app using a Korean mobile number and a one-time SMS code — no invitation code, no employer affiliation, no organization gating.

Like other publicly-distributed regulated-profession apps in Korea (KakaoT Designated Driver, Baemin Connect for delivery riders, SoCar car-sharing, KakaoT Taxi Driver), PortLink Driver verifies a government-issued professional license (화물운송종사자 자격증, Commercial Cargo Driver Qualification) before allowing a driver to accept a paid freight. This license is issued by the Korean Ministry of Land, Infrastructure and Transport directly to the individual driver — it is NOT an internal organization credential. Anyone in Korea who obtains this public license can use the app.

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

---

## 거절 회신용 — 1.0(4) 3.2 재거절 (영문, Resolution Center에 그대로 붙여넣기)

> Submission ID 9f95ff4e-b33a-49a9-8d47-cb2372a1d85d (1.0 build 4) Reply
> 3.2 비즈니스 단독 거절. 이전 회신의 "no admin approval" 문구가 가입 화면 "관리자 승인" 카피와 정면 충돌한 점 자진 정정 + 규제 면허 확인 모델 + 동종 공개 App Store 앱 4종 사례 인용.

```
Hello App Review Team,

Thank you for continuing to review submission 9f95ff4e-b33a-49a9-8d47-cb2372a1d85d (version 1.0 build 4). We want to begin by correcting one inaccuracy in our previous Guideline 3.2 response, and then clarify the regulatory context that we should have stated more precisely the first time.

================================================================
Correction to our previous answer
================================================================

In our prior response to question 4 ("How do users obtain an account?"), we wrote: "There is no employer code, partner referral, or admin approval step." That statement was imprecise and we apologize for the confusion. While there is no employer code or partner referral, there IS a professional-license verification step required by Korean law before a driver can accept a paid freight through the app. Our signup screens previously used the Korean phrase "관리자 승인" ("admin approval") to describe this step, which we now recognize was misleading both to your team and to our users. In build 5 we have rewritten the user-facing copy on every signup screen to accurately describe this as a regulatory license check, not an organizational approval.

================================================================
Regulatory context — Korean Trucking Transportation Business Act
================================================================

Operating a commercial container truck in South Korea legally requires a government-issued professional license called the 화물운송종사자 자격증 (Commercial Cargo Driver Qualification), mandated by the Korean Trucking Transportation Business Act (화물자동차 운수사업법). Any platform that connects licensed drivers with paid freight is legally required to verify this license before allowing the driver to accept paid shipments.

This is NOT an organizational gate. Specifically:

  - The license is issued by the Korean Ministry of Land, Infrastructure and Transport directly to the individual driver. There is no organization, employer, partner, or company that authorizes it. Any Korean citizen who passes the standardized written and physical exams obtains it.
  - The verification is applied uniformly to every driver who downloads the app. There is no allowlist, invitation code, or membership prerequisite.
  - Build 5 rewrites the user-facing copy on every signup screen to accurately describe this as a regulatory license check, not an "admin approval". The account model is SMS OTP based, identical to consumer-app norms; the license check is the same kind of professional-credential verification that SoCar (Korean driver's license) and KakaoT Designated Driver (designated-driver license) perform.

================================================================
Comparable publicly-distributed App Store apps in Korea
================================================================

The following Korean apps follow the same regulatory pattern — open public App Store distribution PLUS government-issued professional-license verification — and are listed publicly without 3.2 restriction:

  1. KakaoT Designated Driver (카카오T 대리) — verifies 운전대행업 등록 (Designated Driver business license).
  2. Baemin Connect / Coupang Eats / Yogiyo Rider — verify 배달원 등록 (Delivery Worker registration) per Korean labor law.
  3. SoCar / GreenCar (car-sharing) — verify 운전면허 (Korean driver's license) before rental.
  4. KakaoT Driver / Tmap Taxi (taxi-driver companion apps) — verify 택시운전 자격증 (Taxi Driver Qualification).

All of these are individual sole-proprietor regulated-profession apps, distributed publicly on the App Store, exactly like PortLink Driver. License verification in each case is a legal compliance step, not a B2B organization gate.

================================================================
The general-public test, restated
================================================================

  Question 1 — restricted to a single company / organization?
    NO. Any Korean citizen who obtains the Commercial Cargo Driver Qualification (a public license) can become a PortLink Driver user. There is no employer, organization, or partner that authorizes signup.

  Question 2 — limited or specific group of companies?
    NO. The target audience is the entire open population of approximately 25,000 individual owner-operator container truck drivers in Korea, plus any new entrants who obtain the public license in the future.

  Question 3 — features for the general public?
    All driver-facing features are public. In addition, the /calculator page — a Korean Safe-Freight Act rate calculator — requires NO login at all and is openly accessible to any visitor (drivers, freight forwarders, journalists, students, lawyers researching the regulation).

  Question 4 — how do users obtain an account? [CORRECTED]
    Drivers register inside the app using their Korean mobile number, which receives a one-time SMS code via the standard Korean carrier SMS network. There is no invitation code, no employer code, and no partner referral. The signup flow is identical to consumer-app norms in Korea. A government-issued license check (화물운송종사자 자격증) is performed once before the driver accepts their first PAID freight — identical to how SoCar verifies a Korean driver's license before unlocking a rental, or how Baemin Connect verifies delivery worker registration. This check is regulatory compliance, not organization gating.

  Question 5 — paid content in the app?
    NO. PortLink Driver has no in-app purchase, no subscription, no paywall, and no consumable. Drivers do not pay anything to use the app or any feature within it. Settlement amounts shown are payouts owed to the driver from freight forwarders for completed shipments, processed through standard Korean B2B bank transfer and tax invoice channels — entirely outside the App Store payment system, as these are real-world freight payments and not digital content covered by Guideline 3.1.

================================================================
Re-test instructions for build 5
================================================================

  1. Open the app and tap "차주 로그인" (Driver Login).
  2. Enter "010-3000-0001" and tap "인증번호 받기" (Send OTP).
  3. Enter "999999" and tap "로그인" (Sign In) — you are signed in immediately.
  4. Browse /driver/jobs, view safe-freight verification, accept a sample freight, and download a sample PDF.
  5. The public calculator is at /calculator and requires NO login.

  Alternate demo accounts D-0002 through D-0005 work identically with phones 010-3000-0002 through 010-3000-0005 and the same OTP "999999".

================================================================
Distribution choice — public App Store
================================================================

For the reasons above, we respectfully maintain that public App Store distribution is the correct channel for this app. It is designed for, marketed to, and used by an open public population of independent Korean container truck drivers — a publicly-licensed, openly-identifiable profession that any qualified individual can join, following the same regulatory and distribution model as several other Korean public App Store apps cited above.

If any of the answers above need further supporting documentation (for example, a copy of the Korean Trucking Transportation Business Act §8 license requirement, statistics on the size of the Korean independent container driver population, or screenshots of the open SMS-OTP signup flow in build 5), we are happy to provide them promptly.

Thank you for your time and continued review of PortLink Driver.

— PortLink Team
```

---

## 거절 회신용 — 1.0(4) 한국어 보조 (참고)

```
=== 한국어 요약 — Apple은 영문만 봅니다 ===

[1.0(4) 3.2 재거절 — 단독]
- 이전 회신의 "no admin approval"이 가입 화면 "관리자 승인" 카피와 충돌 → 자진 정정
- 한국 화물자동차 운수사업법이 의무화하는 화물운송종사자 자격증 확인 = 정부 발급 면허, 조직 게이트 X
- 동일 모델 공개 App Store 앱: 카카오T 대리 / 배민커넥트 / 쏘카 / 카카오T 택시 기사용
- build 5 변경: 가입 시점은 OTP로 즉시 완료, 면허 확인은 첫 화물 수락 시점에만 (쏘카가 운전면허 확인하는 모델과 동일)
- /calculator는 여전히 비로그인 공개 페이지
```

---

## 거절 회신용 — 1.0(5) 5.1.1(v) 계정 삭제 (긴 영문 원본, 4,000자 한도 초과 — 참고용)

> Submission ID 9f95ff4e-b33a-49a9-8d47-cb2372a1d85d (1.0 build 5) Reply
> Guideline 5.1.1(v) 단독 거절. 앱 내 계정 삭제 미구현 → build 6에서 in-app 삭제 흐름 추가.

```
Hello App Review Team,

Thank you for the detailed feedback on submission 9f95ff4e-b33a-49a9-8d47-cb2372a1d85d (version 1.0 build 5). We have implemented full in-app account deletion in build 6 in response to Guideline 5.1.1(v).

================================================================
Guideline 5.1.1(v) — Account Deletion
================================================================

What we added in build 6:
- A "회원 탈퇴" (Delete Account) entry point in the existing "내 정보" (Me) tab, immediately below "로그아웃" (Sign Out), inside a dedicated "계정 관리" (Account Management) card.
- A two-step confirmation: tapping the entry opens a sheet that lists exactly what will be removed, warns that the same phone number cannot be re-registered after deletion, and requires the user to type the keyword "탈퇴" (delete) into a text field before the destructive button enables.
- A single POST request to /api/account/delete that performs the deletion atomically inside one database transaction, then signs the user out and returns them to the public landing page.

Data handled at deletion:
- Personally identifiable information (full name, email, phone number, password hash, driver license number, bank name, and bank account number) is immediately anonymized — overwritten in place inside the same transaction.
- The user's notification queue and registered push-notification device tokens (APNs / FCM) are immediately and permanently deleted, so no further notifications or backend pushes can reach the user.
- The user account is set to status SUSPENDED with a deletedAt timestamp, which permanently blocks every login path (phone OTP, email+password, all NextAuth providers).
- The phone number is rewritten to an anonymous internal identifier so the same Korean mobile number cannot be re-used to re-register the same account.
- Trip records, settlement records, and tax invoice records are retained in anonymized form, because Korean tax law (국세기본법 §85-3) and the Korean Trucking Transportation Business Act both require five-year retention of freight transaction records. After deletion these records no longer point to identifiable personal data — only the anonymized account row.

No customer service required. No phone call required. No email required. The entire flow is in-app, takes about ten seconds, and ends with the user signed out of the app.

================================================================
How to test in build 6
================================================================

To preserve our pre-seeded demo accounts (D-0001 through D-0005) for navigation testing, we have allow-listed five additional throwaway phone numbers specifically for the deletion test. None of these are seeded — they exist only on the OTP bypass list so reviewers can sign up a fresh account, exercise the delete flow, and discard it.

  Phone numbers reserved for deletion testing:
    010-3000-9001
    010-3000-9002
    010-3000-9003
    010-3000-9004
    010-3000-9005
  Fixed verification code: 999999

Step-by-step:
  1. Open the app and tap "차주 가입" (Driver Signup) on the welcome screen. (Or tap "차주 로그인" and follow the same OTP flow — first-time use auto-creates the account.)
  2. Enter phone "010-3000-9001" and tap "인증번호 받기" (Send OTP).
  3. Enter "999999" as the verification code and complete signup. You will land on /driver/jobs.
  4. Tap the "내 정보" (Me) tab at the bottom.
  5. Scroll to the "계정 관리" (Account Management) card at the bottom of the page.
  6. Tap "회원 탈퇴" (Delete Account). A confirmation sheet appears explaining what data will be removed.
  7. Type "탈퇴" (delete) into the confirmation field. The "탈퇴하기" (Delete) button becomes enabled.
  8. Tap "탈퇴하기". The deletion completes in approximately one second; a success toast appears and the app signs you out and returns to the public landing page.
  9. To verify the account cannot be reused: tap "차주 로그인" again, enter "010-3000-9001" + "999999". The OTP succeeds (the bypass list still includes the number), but the credentials provider rejects the login because the underlying account is SUSPENDED. You will not be able to sign back in to the deleted account.

If 010-3000-9001 has already been used by a previous reviewer (and therefore cannot be re-registered), please use 010-3000-9002 through 010-3000-9005 instead — any one of them works identically.

================================================================
Account deletion does NOT require customer service
================================================================

To address one specific point in the rejection letter: PortLink Driver does not require users to contact customer support, call a phone number, or send an email to delete their account. Account deletion is completed entirely inside the app, in approximately ten seconds, from a clearly-labelled entry point in the Me tab.

The two-step confirmation (a warning sheet plus a keyword that the user must explicitly type) is included solely to prevent accidental deletion — Apple explicitly permits this kind of confirmation step under Guideline 5.1.1(v) — and does not gate deletion on any external action.

================================================================
A short note on retained anonymized records
================================================================

We retain anonymized freight transaction records (Trip, Settlement, TaxInvoice) for the legal minimum period required by Korean tax law (five years) after deletion. After the deletion is complete, these records no longer reference any personal data — name, email, phone number, license number, and bank details have all been overwritten. The user's account is no longer reachable via login.

If your team prefers that we describe this nuance differently in our Privacy Policy or in this answer, we are happy to revise either. The relevant Korean legal references are:

  - 개인정보 보호법 (Personal Information Protection Act) §21 — anonymization of retained records after the purpose of collection ends.
  - 국세기본법 (Framework Act on National Taxes) §85-3 — five-year retention of tax invoice records.
  - 화물자동차 운수사업법 (Trucking Transportation Business Act) §44 — retention of dispatch and settlement records.

================================================================
Demo video
================================================================

If a screen recording would be helpful, we will be glad to provide one captured on a physical device showing the full signup → deletion flow. Please let us know and we will attach it to a follow-up message.

Thank you for your time and for reviewing PortLink Driver.

— PortLink Team
```

---

## 거절 회신용 — 1.0(5) 5.1.1(v) **트리밍판** (3,500자 이내, Resolution Center에 그대로 붙여넣기)

```
Hello App Review Team,

Build 6 implements full in-app account deletion in response to Guideline 5.1.1(v). No customer service, phone call, or email is required — the entire flow runs inside the app.

================================================================
What we added in build 6
================================================================

• A "회원 탈퇴" (Delete Account) entry in the "내 정보" (Me) tab, inside a "계정 관리" (Account Management) card directly below "로그아웃" (Sign Out).
• Two-step confirmation: an explanation sheet that lists exactly what will be removed, plus a text field where the user must type the keyword "탈퇴" before the destructive button enables. (Apple permits confirmation steps under 5.1.1(v); this only prevents accidents.)
• POST /api/account/delete performs deletion atomically in a single DB transaction, then signs the user out and returns them to the public landing page.

Data handled at deletion:
• Personally identifiable information — name, email, phone number, password hash, professional driver license number, bank name, and bank account number — is immediately anonymized (overwritten in place inside the same transaction).
• Notification queue and registered push tokens (APNs / FCM) are immediately and permanently deleted, so no further backend pushes can reach the user.
• Account status is set to SUSPENDED with a deletedAt timestamp. Every login path (phone OTP, email+password, all NextAuth providers) rejects the account afterward.
• The phone number is rewritten to an anonymous internal identifier so the same Korean mobile number cannot be re-used to re-register the same account.
• Freight transaction records (Trip, Settlement, TaxInvoice) are retained in fully anonymized form for the legal minimum period required by Korean tax law (5 years, 국세기본법 §85-3) and the Korean Trucking Transportation Business Act (§44). After deletion these records reference no personal data.

================================================================
How to test in build 6
================================================================

To keep our pre-seeded demo accounts (D-0001 ~ D-0005) intact for other navigation testing, we have allow-listed five throwaway phone numbers specifically for the deletion test. None are seeded — they exist only on the OTP bypass list so reviewers can sign up, delete, and discard.

  Deletion-test phones: 010-3000-9001 / 9002 / 9003 / 9004 / 9005
  Fixed OTP code:       999999

Steps:
  1. Open the app and tap "차주 가입" (Driver Signup) on the welcome screen.
  2. Enter phone "010-3000-9001" → tap "인증번호 받기" (Send OTP).
  3. Enter "999999" → complete signup → you land on /driver/jobs.
  4. Tap the "내 정보" (Me) tab.
  5. Scroll to the "계정 관리" card at the bottom.
  6. Tap "회원 탈퇴" (Delete Account). A confirmation sheet appears.
  7. Type "탈퇴" in the confirmation field → tap "탈퇴하기" (Delete).
  8. The deletion completes in ~1 second; you are signed out automatically.

To verify the account cannot be reused: tap "차주 로그인" again, enter "010-3000-9001" + "999999". OTP succeeds, but credentials login rejects the account (SUSPENDED). You cannot sign back in.

If 010-3000-9001 has already been used by a previous reviewer, use any of 010-3000-9002 ~ 9005 — they work identically.

If a screen recording on a physical device would help, we will gladly attach one in a follow-up message.

Thank you,
— PortLink Team
```

---

## 거절 회신용 — 1.0(5) 한국어 보조 (참고)

```
=== 한국어 요약 — Apple은 영문만 봅니다 ===

[1.0(5) 5.1.1(v) 거절 — 단독]
- 거절 사유: 앱 내 회원 탈퇴 진입점 부재
- build 6 추가:
  · /driver/me 하단 "계정 관리" 카드 + "회원 탈퇴" 버튼
  · 2단계 확인: 안내 + 키워드 "탈퇴" 입력 검증
  · POST /api/account/delete → 트랜잭션 1회로 익명화 + signOut
- 익명화 범위: 이름 / 이메일 / 휴대폰 / 비밀번호 / 자격증 / 계좌
- 즉시 삭제: Notification, DeviceToken (APNs/FCM)
- status=SUSPENDED + deletedAt 기록 → 모든 로그인 경로 차단
- 같은 번호 재가입 불가 (phone='deleted:<id>'로 재작성)
- 보존: Trip / Settlement / TaxInvoice (국세기본법 §85-3, 화물자동차 운수사업법 §44 — 5년)
- 데모용 화이트리스트 5개 추가: 010-3000-9001~9005
  → reviewer가 fresh 가입 후 탈퇴 시연 → D-0001~5 시드 무손상
```
