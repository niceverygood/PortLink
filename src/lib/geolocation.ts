/**
 * navigator.geolocation 1회 호출 헬퍼.
 *
 * - 권한 거부/타임아웃이어도 throw하지 않고 null 반환 → 호출자는 위치 없이도 진행 가능
 * - 백그라운드 추적 X. 액션 직전 1회만.
 * - timeout 5초 (모바일 GPS cold start 고려), maximumAge 60초 (직전 좌표 재사용 허용)
 *
 * 사용 예:
 *   const loc = await captureLocationOnce();
 *   await action({ ..., latitude: loc?.latitude, longitude: loc?.longitude });
 */
export interface LocationCapture {
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  capturedAt: string; // ISO
}

export async function captureLocationOnce(): Promise<LocationCapture | null> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) return null;

  return new Promise<LocationCapture | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), 5500);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
          capturedAt: new Date().toISOString(),
        });
      },
      () => {
        // 권한 거부 / OS 거부 / 타임아웃 — best-effort라 조용히 null
        clearTimeout(timer);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60_000,
      },
    );
  });
}
