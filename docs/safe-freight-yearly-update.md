# 안전운임 연도별 갱신 SOP

> 매년 1월 마지막 주 국토교통부 고시 → 2월 1일 시행. PortLink는 1년 유효기간이 끝나면 새 고시로 시드 갱신 필요. 이 문서가 그 작업 절차.

## 캘린더 reminder

매년 **1월 25일** 캘린더 알림 등록 (반복).

- 제목: `[PortLink] 화물자동차 안전운임 신년 고시 확보`
- 알림 기간: 2027년부터 매년 (현재 시점 적용 고시는 2026-55호, 2026-12-31까지 유효)

## 단계

### 1. 새 고시 PDF 확보 (1월 마지막 주)

URL 후보 (셋 중 하나에 게시):

- 국토교통부 보도자료 — https://www.molit.go.kr/USR/NEWS/m_71/lst.jsp
- 국토교통부 고시·공고 — https://www.molit.go.kr/USR/I0204/m_45/lst.jsp
- 화물자동차 안전운임 위원회 — https://www.molit.go.kr/USR/policyData/list.jsp

검색어: `안전운임 고시`, `2027년 안전운임`

### 2. 데이터 추출

PDF → 텍스트 변환 후 다음 4개 데이터셋 추출:

1. **거리별 운임표** — 1km부터 550km까지 모든 row의 6개 컬럼 (안전위탁/운수사업자간/안전운송 × 20FT/40FT)
2. **터미널 내 거리** — 항만별 km
3. **항만 배후단지 별도 운임** — 부산신항·광양항 편도 요율
4. **할증 마스터** — 14종 할증 코드 + 할증률

### 3. 새 시드 파일 생성

```bash
cp prisma/seeds/safe-freight-2026.ts prisma/seeds/safe-freight-2027.ts
```

수정 항목:

- `SAFE_FREIGHT_META.effectiveFrom`/`effectiveTo`/`noticeNumber`/`noticeDate`
- `DISTANCE_RATE_TABLE`의 모든 운임값
- `TERMINAL_INNER_DISTANCE_KM` (보통 변경 없음)
- `PORT_HINTERLAND_RATES`
- `SURCHARGE_RULES` (보통 변경 없음, 률만 미세 조정)

### 4. 시드 함수 추가

`prisma/seeds/safe-freight-seeder.ts`에 `seedSafeFreight2027` 추가 (2026 함수와 동일 로직, import 변경만):

```ts
import { ... } from './safe-freight-2027';

export async function seedSafeFreight2027(prisma: PrismaClient): Promise<SeedResult> {
  // ... 2026과 동일 ...
}
```

`prisma/seed.ts`의 main()에 호출 추가.

### 5. 검증 스크립트 (수기)

새 고시 적용 전 콘솔에서 3개 anchor 값 검증:

```bash
npx dotenv-cli -e .env.production -- npm run seed
# 적재 후
curl -X POST https://port-link-snowy.vercel.app/api/freight/calculate \
  -H 'content-type: application/json' \
  -d '{"originDistanceKm":1,"containerType":"FORTY_FT","shipmentDate":"2027-02-01T00:00:00Z"}'
# → 1km anchor 값 일치 확인

curl -X POST https://port-link-snowy.vercel.app/api/freight/calculate \
  -d '{"originDistanceKm":100,"containerType":"FORTY_FT","shipmentDate":"2027-02-01T00:00:00Z"}'
# → 100km anchor 일치

curl -X POST https://port-link-snowy.vercel.app/api/freight/calculate \
  -d '{"originDistanceKm":400,"containerType":"FORTY_FT","shipmentDate":"2027-02-01T00:00:00Z"}'
# → 400km anchor 일치
```

3개 모두 PDF 원문값과 일치하면 적재 정상.

### 6. 배포 순서

```
1. 시드 파일 작성 + 단위 테스트 (vitest 6 케이스 → 새 anchor 값으로 갱신)
2. 로컬 typecheck/lint/test
3. PR 생성 + 리뷰
4. 머지 → Vercel 자동 배포
5. prod에서 npm run seed 실행 (수동 트리거)
6. 헬스체크 API로 검증 (위 3 anchor)
7. 차주 화면에서 위젯이 새 고시 번호 표기 확인
```

### 7. 효력 전환 처리

기존 2026 스냅샷의 `effectiveTo`는 2026-12-31. 2027 스냅샷의 `effectiveFrom`은 2027-02-01.
**1개월 공백** (2027-01-01 ~ 2027-01-31) 동안 calculator는 `OUT_OF_EFFECTIVE_PERIOD` 반환.

대응:

- 1월에 픽업 예정 배차는 12월 말 전에 등록·계산되도록 운영 안내
- 또는 2026 스냅샷의 effectiveTo를 임시로 2027-01-31까지 연장하는 hot-patch (단기 미봉책)

## 문제 발생 시

- 운임값이 음수/0 → seed 함수의 보간 로직 점검
- 가산방식 합계가 100% 초과 → calculator의 `calculateEffectiveSurchargeRate` 검증
- `OUT_OF_EFFECTIVE_PERIOD` 광범위 발생 → effectiveFrom/To 메타 확인
