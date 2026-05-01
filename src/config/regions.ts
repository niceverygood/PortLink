/**
 * PortLink 안전운임 마스터 시군구 30곳.
 *
 * 선정 기준: 컨테이너 운송 수요가 큰 산업단지/항만 배후/물류단지를 중심으로
 * 수도권(15) + 영남(8) + 충청(4) + 호남(3) 분포.
 *
 * 안전운임 base는 5개 항만 각각까지의 대략적 거리/통행료를 반영한 더미값.
 * Stage 1 시점에는 실제 안전운임 고시값과 상관 없는 시연용 데이터이며
 * Phase 2에서 국토부 실거리/실고시 운임으로 교체 예정.
 */

export interface Region {
  /** 표시명: "경기 평택" */
  name: string;
  /** 광역 시도 */
  province: string;
  /** 항만까지 베이스 운임 (KRW, 40FT 기준). 차종 계수 적용 전 값. */
  baseFareToPort: Record<'BUSAN' | 'BUSAN_NEW' | 'INCHEON' | 'GWANGYANG' | 'PYEONGTAEK', number>;
}

// 운임은 5만원 단위로 라운딩, 거리 비례 + 항만별 가산
export const REGIONS: readonly Region[] = [
  // 수도권 — 인천/평택 가깝고 부산/광양 멀음
  {
    name: '경기 평택',
    province: '경기',
    baseFareToPort: {
      BUSAN: 750_000,
      BUSAN_NEW: 750_000,
      INCHEON: 200_000,
      GWANGYANG: 600_000,
      PYEONGTAEK: 100_000,
    },
  },
  {
    name: '경기 화성',
    province: '경기',
    baseFareToPort: {
      BUSAN: 800_000,
      BUSAN_NEW: 800_000,
      INCHEON: 250_000,
      GWANGYANG: 650_000,
      PYEONGTAEK: 150_000,
    },
  },
  {
    name: '경기 안산',
    province: '경기',
    baseFareToPort: {
      BUSAN: 800_000,
      BUSAN_NEW: 800_000,
      INCHEON: 200_000,
      GWANGYANG: 650_000,
      PYEONGTAEK: 200_000,
    },
  },
  {
    name: '경기 시흥',
    province: '경기',
    baseFareToPort: {
      BUSAN: 800_000,
      BUSAN_NEW: 800_000,
      INCHEON: 150_000,
      GWANGYANG: 650_000,
      PYEONGTAEK: 200_000,
    },
  },
  {
    name: '경기 안성',
    province: '경기',
    baseFareToPort: {
      BUSAN: 700_000,
      BUSAN_NEW: 700_000,
      INCHEON: 250_000,
      GWANGYANG: 600_000,
      PYEONGTAEK: 150_000,
    },
  },
  {
    name: '경기 이천',
    province: '경기',
    baseFareToPort: {
      BUSAN: 750_000,
      BUSAN_NEW: 750_000,
      INCHEON: 300_000,
      GWANGYANG: 650_000,
      PYEONGTAEK: 250_000,
    },
  },
  {
    name: '경기 광주',
    province: '경기',
    baseFareToPort: {
      BUSAN: 750_000,
      BUSAN_NEW: 750_000,
      INCHEON: 300_000,
      GWANGYANG: 650_000,
      PYEONGTAEK: 250_000,
    },
  },
  {
    name: '경기 김포',
    province: '경기',
    baseFareToPort: {
      BUSAN: 850_000,
      BUSAN_NEW: 850_000,
      INCHEON: 150_000,
      GWANGYANG: 700_000,
      PYEONGTAEK: 250_000,
    },
  },
  {
    name: '경기 파주',
    province: '경기',
    baseFareToPort: {
      BUSAN: 900_000,
      BUSAN_NEW: 900_000,
      INCHEON: 200_000,
      GWANGYANG: 750_000,
      PYEONGTAEK: 300_000,
    },
  },
  {
    name: '경기 용인',
    province: '경기',
    baseFareToPort: {
      BUSAN: 750_000,
      BUSAN_NEW: 750_000,
      INCHEON: 250_000,
      GWANGYANG: 650_000,
      PYEONGTAEK: 200_000,
    },
  },
  {
    name: '인천 남동',
    province: '인천',
    baseFareToPort: {
      BUSAN: 850_000,
      BUSAN_NEW: 850_000,
      INCHEON: 100_000,
      GWANGYANG: 700_000,
      PYEONGTAEK: 250_000,
    },
  },
  {
    name: '인천 서구',
    province: '인천',
    baseFareToPort: {
      BUSAN: 850_000,
      BUSAN_NEW: 850_000,
      INCHEON: 100_000,
      GWANGYANG: 700_000,
      PYEONGTAEK: 300_000,
    },
  },
  {
    name: '서울 강서',
    province: '서울',
    baseFareToPort: {
      BUSAN: 850_000,
      BUSAN_NEW: 850_000,
      INCHEON: 200_000,
      GWANGYANG: 700_000,
      PYEONGTAEK: 300_000,
    },
  },
  {
    name: '서울 금천',
    province: '서울',
    baseFareToPort: {
      BUSAN: 800_000,
      BUSAN_NEW: 800_000,
      INCHEON: 200_000,
      GWANGYANG: 700_000,
      PYEONGTAEK: 250_000,
    },
  },
  {
    name: '서울 송파',
    province: '서울',
    baseFareToPort: {
      BUSAN: 800_000,
      BUSAN_NEW: 800_000,
      INCHEON: 250_000,
      GWANGYANG: 700_000,
      PYEONGTAEK: 250_000,
    },
  },

  // 충청 — 평택에 가까움
  {
    name: '충남 천안',
    province: '충남',
    baseFareToPort: {
      BUSAN: 650_000,
      BUSAN_NEW: 650_000,
      INCHEON: 350_000,
      GWANGYANG: 550_000,
      PYEONGTAEK: 200_000,
    },
  },
  {
    name: '충남 아산',
    province: '충남',
    baseFareToPort: {
      BUSAN: 650_000,
      BUSAN_NEW: 650_000,
      INCHEON: 350_000,
      GWANGYANG: 550_000,
      PYEONGTAEK: 150_000,
    },
  },
  {
    name: '충남 당진',
    province: '충남',
    baseFareToPort: {
      BUSAN: 700_000,
      BUSAN_NEW: 700_000,
      INCHEON: 350_000,
      GWANGYANG: 600_000,
      PYEONGTAEK: 150_000,
    },
  },
  {
    name: '충북 청주',
    province: '충북',
    baseFareToPort: {
      BUSAN: 600_000,
      BUSAN_NEW: 600_000,
      INCHEON: 400_000,
      GWANGYANG: 500_000,
      PYEONGTAEK: 250_000,
    },
  },

  // 영남 — 부산/부산신항에 가까움
  {
    name: '경남 김해',
    province: '경남',
    baseFareToPort: {
      BUSAN: 150_000,
      BUSAN_NEW: 100_000,
      INCHEON: 850_000,
      GWANGYANG: 350_000,
      PYEONGTAEK: 800_000,
    },
  },
  {
    name: '경남 양산',
    province: '경남',
    baseFareToPort: {
      BUSAN: 150_000,
      BUSAN_NEW: 200_000,
      INCHEON: 850_000,
      GWANGYANG: 400_000,
      PYEONGTAEK: 800_000,
    },
  },
  {
    name: '경남 창원',
    province: '경남',
    baseFareToPort: {
      BUSAN: 200_000,
      BUSAN_NEW: 150_000,
      INCHEON: 900_000,
      GWANGYANG: 350_000,
      PYEONGTAEK: 850_000,
    },
  },
  {
    name: '경남 진주',
    province: '경남',
    baseFareToPort: {
      BUSAN: 300_000,
      BUSAN_NEW: 250_000,
      INCHEON: 950_000,
      GWANGYANG: 250_000,
      PYEONGTAEK: 900_000,
    },
  },
  {
    name: '울산 남구',
    province: '울산',
    baseFareToPort: {
      BUSAN: 200_000,
      BUSAN_NEW: 250_000,
      INCHEON: 900_000,
      GWANGYANG: 500_000,
      PYEONGTAEK: 850_000,
    },
  },
  {
    name: '울산 울주',
    province: '울산',
    baseFareToPort: {
      BUSAN: 250_000,
      BUSAN_NEW: 300_000,
      INCHEON: 900_000,
      GWANGYANG: 500_000,
      PYEONGTAEK: 850_000,
    },
  },
  {
    name: '경북 구미',
    province: '경북',
    baseFareToPort: {
      BUSAN: 350_000,
      BUSAN_NEW: 350_000,
      INCHEON: 700_000,
      GWANGYANG: 500_000,
      PYEONGTAEK: 650_000,
    },
  },
  {
    name: '경북 포항',
    province: '경북',
    baseFareToPort: {
      BUSAN: 300_000,
      BUSAN_NEW: 350_000,
      INCHEON: 800_000,
      GWANGYANG: 600_000,
      PYEONGTAEK: 750_000,
    },
  },
  {
    name: '대구 달서',
    province: '대구',
    baseFareToPort: {
      BUSAN: 350_000,
      BUSAN_NEW: 350_000,
      INCHEON: 750_000,
      GWANGYANG: 500_000,
      PYEONGTAEK: 700_000,
    },
  },

  // 호남 — 광양에 가까움
  {
    name: '전남 여수',
    province: '전남',
    baseFareToPort: {
      BUSAN: 400_000,
      BUSAN_NEW: 400_000,
      INCHEON: 950_000,
      GWANGYANG: 100_000,
      PYEONGTAEK: 900_000,
    },
  },
  {
    name: '전남 순천',
    province: '전남',
    baseFareToPort: {
      BUSAN: 400_000,
      BUSAN_NEW: 400_000,
      INCHEON: 900_000,
      GWANGYANG: 150_000,
      PYEONGTAEK: 850_000,
    },
  },
] as const;

if (REGIONS.length !== 30) {
  // 컴파일 시점에 잡히는 가드 — 30개 정확히
  throw new Error(`REGIONS must be exactly 30, got ${REGIONS.length}`);
}

/** 차종별 운임 계수 (40FT 기준 1.0). 안전운임 더미 산정에 사용. */
export const CONTAINER_TYPE_COEFFICIENT = {
  '20FT': 0.75,
  '40FT': 1.0,
  '40FT_HC': 1.05,
} as const;
