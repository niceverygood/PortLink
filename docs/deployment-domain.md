# portlink.kr 도메인 연결 절차

> Stage 7 task 5. 코드/Vercel 설정은 이 PR로 끝났고, **DNS 등록 작업만 남음**.

## 1. 현재 상태

| 항목                         | 상태                                                                |
| ---------------------------- | ------------------------------------------------------------------- |
| Vercel 프로젝트              | `port-link-snowy.vercel.app` (Production)                           |
| 리전                         | `icn1` (Seoul) — `vercel.json`로 강제                               |
| HSTS                         | Vercel이 자동 추가 (`max-age=63072000; includeSubDomains; preload`) |
| 그 외 보안 헤더 (X-Frame 등) | `next.config.mjs`의 `headers()` 함수에서 적용                       |
| Sentry SDK                   | `withSentryConfig` 래핑 완료 — env 등록 후 자동 캡처                |
| 도메인 (`portlink.kr`)       | **미연결** — 아래 절차 필요                                         |

## 2. Vercel에서 도메인 추가

1. Vercel Dashboard → `port-link` 프로젝트 → **Settings → Domains**
2. `portlink.kr` 입력 → **Add**
3. (권장) `www.portlink.kr` 추가 → "Redirect to portlink.kr" 선택
4. Vercel이 표시하는 DNS 레코드 메모 (보통 아래 두 가지 중 하나):
   - **A 레코드**: `76.76.21.21` (apex `portlink.kr` 용)
   - **CNAME 레코드**: `cname.vercel-dns.com` (`www` 용)

## 3. 도메인 등록사 DNS 콘솔 작업

`portlink.kr` 등록한 곳 (가비아 / Cloudflare / Namecheap 등) 콘솔에서:

| Type  | Host  | Value                  | TTL |
| ----- | ----- | ---------------------- | --- |
| A     | `@`   | `76.76.21.21`          | 600 |
| CNAME | `www` | `cname.vercel-dns.com` | 600 |

**ALIAS / ANAME 지원하면 그게 더 좋음** (A 레코드 IP가 바뀔 때 자동 추적):

| Type  | Host  | Value                  |
| ----- | ----- | ---------------------- |
| ALIAS | `@`   | `cname.vercel-dns.com` |
| CNAME | `www` | `cname.vercel-dns.com` |

> **가비아의 경우**: A 레코드만 지원하므로 위쪽 표 사용.

## 4. 전파 + 검증

DNS 전파는 보통 15분~1시간. 빠른 확인:

```bash
# A 레코드 전파 확인
dig +short portlink.kr
# → 76.76.21.21 가 떠야 함

# Vercel 도메인 인증
# Dashboard에서 "Valid Configuration" 체크 표시 확인
```

전파 완료되면 Vercel이 자동으로 Let's Encrypt 인증서 발급 → HTTPS 즉시 동작.

## 5. AUTH_URL 업데이트 (필수)

도메인 붙은 후 Vercel 환경변수 수정:

```
AUTH_URL=https://portlink.kr
```

Production env에서 변경 → Redeploy. NextAuth 콜백 URL이 새 도메인으로 잡힘.

> ⚠️ 이걸 안 하면 OAuth 콜백/세션 쿠키가 도메인 mismatch로 깨짐.

## 6. 보안 헤더 검증

배포 후:

```bash
curl -sI https://portlink.kr | grep -iE 'strict-transport|x-frame|x-content|referrer|permissions'
```

기대 응답:

```
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=(self)
```

[securityheaders.com](https://securityheaders.com/?q=portlink.kr) 점수 A 이상 목표.

## 7. 체크리스트

- [ ] Vercel Domains에 `portlink.kr` + `www.portlink.kr` 추가
- [ ] DNS 레코드 등록 (A or ALIAS + CNAME)
- [ ] `dig portlink.kr` 응답 확인
- [ ] Vercel "Valid Configuration" 체크
- [ ] HTTPS 인증서 자동 발급 확인 (`https://portlink.kr` 접속)
- [ ] `AUTH_URL` 환경변수 업데이트 + Redeploy
- [ ] 보안 헤더 응답 확인 (`curl -I`)
- [ ] securityheaders.com 점수 확인
