/**
 * 항만 + 지역 대표 좌표 사전.
 * MVP에선 정적 dictionary로 충분 (네이버지도 API 미연동, Phase 2).
 * 정확도 ±5km — 차주가 "어느 배차가 더 가까운가" 비교에 충분.
 */
import type { PortCode } from '@prisma/client';

export interface LatLng {
  lat: number;
  lng: number;
}

/** 5개 항만 대표 좌표 (Google Maps 검색 기준 도심부). */
export const PORT_COORDS: Record<PortCode, LatLng> = {
  BUSAN: { lat: 35.0973, lng: 129.0381 }, // 부산북항(신선대)
  BUSAN_NEW: { lat: 35.0838, lng: 128.7894 }, // 부산신항
  INCHEON: { lat: 37.4503, lng: 126.6022 }, // 인천항
  GWANGYANG: { lat: 34.8983, lng: 127.7444 }, // 광양항
  PYEONGTAEK: { lat: 36.9667, lng: 126.8333 }, // 평택항
};

/** 시군구 대표 좌표 — REGIONS와 매칭. 시드/seed 지역 30개 모두 커버. */
export const REGION_COORDS: Record<string, LatLng> = {
  '경기 평택': { lat: 36.9921, lng: 127.1129 },
  '경기 화성': { lat: 37.1995, lng: 126.8312 },
  '경기 안산': { lat: 37.3219, lng: 126.8309 },
  '경기 시흥': { lat: 37.3799, lng: 126.8031 },
  '경기 안성': { lat: 37.0084, lng: 127.2796 },
  '경기 이천': { lat: 37.272, lng: 127.4348 },
  '경기 광주': { lat: 37.4292, lng: 127.2551 },
  '경기 김포': { lat: 37.6151, lng: 126.7159 },
  '경기 파주': { lat: 37.7599, lng: 126.78 },
  '경기 용인': { lat: 37.2411, lng: 127.1776 },
  '인천 남동': { lat: 37.4475, lng: 126.7314 },
  '인천 서구': { lat: 37.5454, lng: 126.6759 },
  '서울 강서': { lat: 37.5509, lng: 126.8495 },
  '서울 금천': { lat: 37.4574, lng: 126.8956 },
  '서울 송파': { lat: 37.5145, lng: 127.106 },
  '충남 천안': { lat: 36.8151, lng: 127.1139 },
  '충남 아산': { lat: 36.7898, lng: 127.0019 },
  '충남 당진': { lat: 36.8893, lng: 126.6451 },
  '충북 청주': { lat: 36.6424, lng: 127.4889 },
  '경남 김해': { lat: 35.2285, lng: 128.8893 },
  '경남 양산': { lat: 35.3349, lng: 129.0376 },
  '경남 창원': { lat: 35.2272, lng: 128.6811 },
  '경남 진주': { lat: 35.18, lng: 128.1076 },
  '울산 남구': { lat: 35.5419, lng: 129.3308 },
  '울산 울주': { lat: 35.5223, lng: 129.2424 },
  '경북 구미': { lat: 36.1196, lng: 128.3441 },
  '경북 포항': { lat: 36.019, lng: 129.3435 },
  '대구 달서': { lat: 35.8294, lng: 128.5325 },
  '전남 여수': { lat: 34.7604, lng: 127.6622 },
  '전남 순천': { lat: 34.9506, lng: 127.4878 },
};

/** 지역명 → 좌표. 매칭 실패 시 null (호출자가 fallback 처리). */
export function getRegionCoord(originRegion: string): LatLng | null {
  return REGION_COORDS[originRegion] ?? null;
}
