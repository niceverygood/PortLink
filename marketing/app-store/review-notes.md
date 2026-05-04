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

PortLink Driver is a B2B mobile application for South Korean container truck drivers (independent contractors). It connects them with freight forwarders for short-haul container transport between major Korean ports (Busan, Incheon, Gwangyang, Pyeongtaek) and inland regions.

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

- [ ] 데모 계정 (D-0001) 로그인 동작 확인 (운영 빌드에서 OTP 999999 우회 가능?)
  → SEED_PASSWORD 또는 별도 REVIEW_OTP_BYPASS 환경변수 검토 필요. **현재 코드엔 미구현 — Stage 10-9 후속 작업 필요**
- [ ] AASA URL 200 OK + Team ID 채워짐 확인
- [ ] APNs production 키 활성 확인 (Stage 10-6)
- [ ] 모든 PDF에 면책 문구 머리/중간/꼬리 3곳 (CLAUDE.md §3)
- [ ] 1-Click 로그인 비활성 (SEED_PASSWORD 미설정 prod) → 관리자 화면 노출 차단
- [ ] privacy/terms URL 200 응답
- [ ] CFBundleVersion = 1, MARKETING_VERSION = 1.0 (Stage 10-3 검증 완료)
