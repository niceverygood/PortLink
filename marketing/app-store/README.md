# marketing/app-store

App Store 1.0 출시용 메타·자산 모음.

| 파일                       | 용도                                           |
| -------------------------- | ---------------------------------------------- |
| `listing-ko.md`            | 앱 이름/부제/설명/키워드/카테고리 — 그대로 복붙 |
| `screenshots-guide.md`     | 5장 구성 + 시뮬레이터 캡처 명령                |
| `screenshots-compose.ts`   | 캡처 원본 → 캡션 합성 (sharp)                  |
| `privacy-answers.md`       | App Privacy 22개 항목 답변지                   |
| `review-notes.md`          | 심사관 영문 안내 + 데모 계정                   |

## 흐름

1. 시뮬레이터에서 5장 캡처 → `screenshots/raw/{1..5}.png`로 저장
2. `npm run screenshots:compose` → `screenshots/composed/{6.5,6.9}/{1..5}.png`
3. App Store Connect 메타 입력 (`listing-ko.md` + `privacy-answers.md` + `review-notes.md`)
4. 빌드 archive → TestFlight → 심사 제출

## 출시 전 미해결

- [ ] portlink.kr DNS 연결 + `/privacy`, `/terms`, `/support` 페이지
- [ ] APPLE_TEAM_ID, APNS_TEAM_ID/KEY_ID/AUTH_KEY 환경변수 등록
- [ ] 심사용 OTP 우회 (REVIEW_OTP_BYPASS 등) 구현
- [ ] Apple Developer Program 가입 (Apple ID 1개당 $99/년)
