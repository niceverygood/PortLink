# PortLink Driver — 스크린샷 촬영·캡션 가이드

> Apple App Store는 1.0 출시 시 6.5"(또는 6.7")와 6.9" 디스플레이 스크린샷을 각각 요구.
> iOS 15 이상 지원 + iPhone 16 Pro Max 출시(2024)로 6.9"가 사실상 표준.
> **6.5"만 등록해도 6.9"는 Apple이 자동 스케일** — 다만 2.3.3 거부 학습(MoneySignal)로 두 사이즈 모두 직접 캡처 권장.

| 사이즈    | 해상도 (Portrait) | 시뮬레이터 디바이스      |
| --------- | ----------------- | ------------------------ |
| 6.5" (필수) | 1242 × 2688       | iPhone 11 Pro Max (iOS 26.x 런타임) |
| 6.9" (권장) | 1290 × 2796       | iPhone 16 Pro Max         |

---

## 5장 구성 (필수 5 / 최대 10)

각 화면은 **데모 계정 D-0001 + 시뮬레이터** 조합으로 캡처.

### 1) 안전운임 자동 검증

- 화면: `/driver/jobs/[id]` (배차 상세에서 SafeFreightVerifier 위젯이 보이는 상태)
- 보이는 요소: 출발지 / 도착지 / 컨테이너 규격 / 안전운임 검증 결과 카드 (✓ 안전운임 이상 또는 ⚠️ 미달)
- **캡션 (상단 오버레이)**: `안전운임 이상인지 한 번에 확인`
- **서브 캡션 (하단)**: `국토교통부 고시 자동 반영`

### 2) Trip 진행 — 출발 보고

- 화면: `/driver/trip/[id]` (TripStatus = DEPARTED 직전, 큰 Orange 액션 버튼 노출)
- 보이는 요소: 컨테이너 정보 / "출발 보고" 버튼 / 버튼 아래 "위치는 액션 시점 1회만 기록 (백그라운드 추적 X)" 문구
- **캡션 (상단)**: `출발·상차·하차 1탭 보고`
- **서브 캡션 (하단)**: `위치는 동의한 시점 1회만`

### 3) §14 공차 운행 안내

- 화면: `/driver/trip/[id]` (직전 trip → 새 trip 출발지 사이 10km 이상 공차 감지된 상태에서 EmptyRunNoticeCard 표시)
- 보이는 요소: 카드 타이틀 "안전운임 §14 공차 운행 안내" / 거리·예상 보상액 / "청구 양식 다운로드" 버튼
- **캡션 (상단)**: `주선사가 알려주지 않던 권리`
- **서브 캡션 (하단)**: `공차 운행 청구 양식 자동 제공`

### 4) 미지급 신고서

- 화면: `/driver/report` (운임 미지급 배차 1건 선택 → 다운로드 버튼)
- 보이는 요소: 미지급 정보 / "신고서 PDF 다운로드" 버튼 / 면책 안내 카피
- **캡션 (상단)**: `미지급 신고서 PDF 즉시 발급`
- **서브 캡션 (하단)**: `참고 자료 — 발송 책임은 본인에게`

### 5) 정산 내역

- 화면: `/driver/settlement` (월별 정산 내역 리스트 + 합계)
- 보이는 요소: 월 합계 / 배차별 정산 row / 상태(DRAFT/CONFIRMED/PAID) 배지
- **캡션 (상단)**: `정산 내역 한눈에`
- **서브 캡션 (하단)**: `세금계산서 자동 발급`

---

## 시뮬레이터 캡처 명령

```bash
# 1) Xcode → Open Developer Tool → Simulator → File → Open Simulator → iPhone 11 Pro Max (iOS 26.x)
# 2) 시뮬레이터 boot 후 UDID 확인
xcrun simctl list devices | grep "iPhone 11 Pro Max"

# 3) 시뮬레이터에서 https://port-link-snowy.vercel.app/driver/jobs 진입
xcrun simctl openurl booted "https://port-link-snowy.vercel.app/driver/jobs"

# 4) 데모 계정 로그인 (D-0001 / 010-3000-0001 / OTP 우회는 SEED_PASSWORD 활성 환경)

# 5) 각 화면으로 이동 후 ⌘+S (시뮬레이터 메뉴 → File → Save Screen)
#    저장 위치: ~/Desktop/Simulator Screen Shot - iPhone 11 Pro Max - YYYY-MM-DD at HH.MM.SS.png

# 6) 6.9" 캡처는 iPhone 16 Pro Max 시뮬레이터에서 동일 절차 반복
```

> **주의 1**: 캡처 전에 시뮬레이터 status bar를 정리: `xcrun simctl status_bar booted override --time "9:41" --batteryLevel 100 --batteryState charged --cellularBars 4 --wifiBars 3 --dataNetwork 5g`
> **주의 2**: 관리자 계정으로 로그인되면 안 됨 — 1-Click 로그인이 켜져 있다면 자동 리다이렉트로 admin 화면 노출 위험. 반드시 차주 데모 계정으로 직접 로그인.

---

## 캡션 합성 (sharp 자동화)

`scripts/screenshots-overlay.ts` 헬퍼로 캡션 텍스트 + 디바이스 프레임 없는 simple overlay 생성.

```bash
# 원본 캡처 5장을 marketing/app-store/screenshots/raw/ 에 1.png ~ 5.png로 저장 후
npm run screenshots:compose
# → marketing/app-store/screenshots/composed/{6.5,6.9}/{1..5}.png 생성
```

(스크립트는 `marketing/app-store/screenshots-compose.ts` 참조)

---

## App Preview (영상, 선택)

- 30초 이내, 1080×1920 (Portrait), `.mp4`/`.mov`
- 1.0 출시는 **생략**해도 OK — 첫 빌드는 스크린샷 5장으로 충분
- 2.0 또는 분기별 업데이트 시 추가 권장 (전환율 +20~30% 통계)

---

## Apple 가이드라인 사전 점검

- [ ] 모든 화면에서 status bar는 9:41 / 100% / 풀 시그널 (Apple 기본 표준)
- [ ] 데이터가 비어 보이는 화면 X (배차 0건, 정산 0원 등) — MoneySignal 학습
- [ ] 관리자 화면(Admin 배지, /admin/* 경로) 노출 0건
- [ ] 캡션은 한국어로 통일 (영문 혼용 X)
- [ ] 이미지 가장자리 둥근 모서리 자동 적용 (Apple이 적용) — 직접 둥글게 깎지 말 것
- [ ] 면책 문구가 보이는 화면 1장 이상 포함 (4.0 분쟁 방지 — MoneySignal 학습)
- [ ] "무료체험 / 첫 달 무료 / 선공개" 표현 0건 (3.1.2(c) 학습)
