/**
 * Haversine 거리 계산 — 위경도 두 점 사이 직선거리 (m).
 * 클라이언트/서버 양쪽 사용 가능. 의존성 0.
 */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** km로 환산해 사람이 읽기 좋게 표시. 100m 미만은 "<1km", 1000km 이상은 자르지 않음. */
export function formatDistance(meters: number): string {
  if (meters < 100) return '< 1km';
  if (meters < 1000) return `${Math.round(meters / 100) * 100}m`;
  const km = meters / 1000;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}
