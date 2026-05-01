/**
 * PortLink 비즈니스 룰 단일 진실의 원천 (single source of truth).
 * 변경 시 반드시 사용자 컨펌 + 영향 범위(정산, UI, 마이그레이션) 확인.
 * CLAUDE.md §6.2 참조.
 */
export const BUSINESS_RULES = {
  // 수수료
  PLATFORM_FEE_RATE: 0.05, // 런칭 5%
  LEGAL_MAX_BROKERAGE: 0.1, // 안전운임제 한도 10%

  // 컨테이너
  CONTAINER_TYPES: ['20FT', '40FT', '40FT_HC'] as const,

  // 항만
  PORTS: [
    { code: 'BUSAN', name: '부산항', region: '부산' },
    { code: 'BUSAN_NEW', name: '부산신항', region: '부산' },
    { code: 'INCHEON', name: '인천항', region: '인천' },
    { code: 'GWANGYANG', name: '광양항', region: '전남' },
    { code: 'PYEONGTAEK', name: '평택항', region: '경기' },
  ] as const,

  // 운송 상태
  TRIP_STATUSES: [
    'PENDING',
    'DEPARTED',
    'LOADED',
    'IN_TRANSIT',
    'UNLOADED',
    'COMPLETED',
    'CANCELLED',
  ] as const,

  // 시간
  TIMEZONE: 'Asia/Seoul',
  CANCEL_GRACE_MINUTES: 5, // 수락 후 5분 내 취소 무벌점
} as const;

export type ContainerType = (typeof BUSINESS_RULES.CONTAINER_TYPES)[number];
export type PortCode = (typeof BUSINESS_RULES.PORTS)[number]['code'];
export type TripStatus = (typeof BUSINESS_RULES.TRIP_STATUSES)[number];
