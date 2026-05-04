# PortLink Driver — App Store Connect "App Privacy" 답변지

> App Store Connect → 앱 정보 → "App Privacy" 섹션 입력값.
> Apple 정의: "수집(Collected)" = 서버에 저장 / "추적(Tracking)" = 다른 앱·웹사이트와 결합해 광고/식별.

---

## 결론 한 줄

- **수집(Collected) — Yes** (서비스 운영을 위한 필수 항목만)
- **추적(Tracking) — No** (광고 SDK·외부 식별자 결합 사용 X)
- 결과 라벨: "Data Linked to You" (연결됨, 추적 X)

---

## 항목별 답변

### Contact Info — 연락처

| 항목         | 수집? | 목적             | 사용자에게 연결? | 추적용? |
| ------------ | ----- | ---------------- | ---------------- | ------- |
| Name (이름)  | Yes   | App Functionality | Yes              | No      |
| Email        | Yes (선택) | App Functionality | Yes         | No      |
| Phone Number | Yes   | App Functionality (OTP 본인 인증) | Yes | No |

### User Content — 사용자 콘텐츠

| 항목                      | 수집? | 목적             | 연결? | 추적? |
| ------------------------- | ----- | ---------------- | ----- | ----- |
| Photos or Videos          | No    | -                | -     | -     |
| Audio Data                | No    | -                | -     | -     |
| Customer Support          | Yes (선택) | App Functionality | Yes | No |

### Identifiers — 식별자

| 항목                | 수집? | 목적                          | 연결? | 추적? |
| ------------------- | ----- | ----------------------------- | ----- | ----- |
| User ID             | Yes   | App Functionality, Authentication | Yes | No |
| Device ID (IDFA/IDFV) | No  | -                             | -     | -     |

> APNs 디바이스 토큰은 Apple이 발급하는 푸시 전용 식별자로, App Store 정의의 Device ID 항목에 해당하지 않음.

### Usage Data — 사용 데이터

| 항목              | 수집? | 목적           | 연결? | 추적? |
| ----------------- | ----- | -------------- | ----- | ----- |
| Product Interaction | Yes | Analytics, App Functionality | Yes | No |
| Advertising Data  | No    | -              | -     | -     |

### Diagnostics — 진단

| 항목             | 수집? | 목적         | 연결? | 추적? |
| ---------------- | ----- | ------------ | ----- | ----- |
| Crash Data       | Yes   | App Functionality (Sentry) | Yes | No |
| Performance Data | Yes   | App Functionality (Sentry) | Yes | No |
| Other Diagnostic Data | Yes | App Functionality (Sentry) | Yes | No |

> Sentry는 자체 호스팅 분석이며 광고·외부 결합 X. tracesSampleRate 0.1, replay 0% (CLAUDE.md ADR 013).

### Location — 위치

| 항목              | 수집? | 목적                                                   | 연결? | 추적? |
| ----------------- | ----- | ------------------------------------------------------ | ----- | ----- |
| Precise Location  | Yes   | App Functionality (배차 출발/도착 시점 좌표 기록 + §14 공차 감지) | Yes | No |
| Coarse Location   | No    | -                                                      | -     | -     |

> 백그라운드 추적 안 함. 차주가 직접 액션 버튼을 누르는 시점에만 1회 기록. 권한 거부 시에도 운송은 정상 진행.

### Financial Info — 금융 정보

| 항목             | 수집? | 목적                | 연결? | 추적? |
| ---------------- | ----- | ------------------- | ----- | ----- |
| Other Financial Info (계좌번호) | Yes | App Functionality (정산 입금 계좌) | Yes | No |
| Payment Info     | No    | (앱 내 결제 없음)   | -     | -     |
| Credit Info      | No    | -                   | -     | -     |

### Sensitive Info — 민감 정보

| 항목                          | 수집? |
| ----------------------------- | ----- |
| Sexual Orientation / Race / Religion / Health 등 | No |

### Contacts (주소록) / Browsing History / Search History — **모두 No**

### Health & Fitness — **No**

### Surroundings (주변 사진/오디오) — **No**

### Other Data

| 항목                          | 수집? | 목적                         | 연결? | 추적? |
| ----------------------------- | ----- | ---------------------------- | ----- | ----- |
| Other (화물운송종사자 자격증 번호) | Yes | App Functionality (가입 자격) | Yes | No |
| Other (사업자등록번호)         | Yes (운송사) | App Functionality | Yes | No |

---

## "Data Used to Track You" — 0건

PortLink Driver는 광고 식별자, 외부 광고 SDK, 분석 SDK(GA/Mixpanel/Firebase Analytics 등)를 사용하지 않음. App Tracking Transparency(ATT) 프롬프트도 노출 X.

---

## 개인정보 처리방침 URL

- 운영: `https://portlink.kr/privacy`
- 임시 (도메인 미연결 시): `https://port-link-snowy.vercel.app/privacy`

> **App Store는 처리방침 URL이 200 OK + 한국어 본문 노출 + 위 답변 내용과 일치해야 통과.**
> 첫 출시 전 `/privacy` 페이지 작성 필수 — 현재 미작성이라면 별도 작업 항목.

---

## Apple Privacy Manifest (PrivacyInfo.xcprivacy)

iOS 17부터 선택. PortLink Driver는 다음 API를 사용:

| API 카테고리              | 사용 사유 코드 |
| ------------------------- | -------------- |
| File timestamp APIs       | C617.1 (앱 자체 파일 작성 시간 액세스) |
| System boot time APIs     | 35F9.1 (이벤트 측정) — 사용 시 |
| Disk space APIs           | 미사용         |
| User defaults APIs        | CA92.1 (앱 자체 설정 저장) |

> 1.0 출시는 PrivacyInfo.xcprivacy 미포함도 통과되지만, 2024년 후반부터 일부 SDK가 요구 → Stage 11 후속 작업으로 추가 권장.
