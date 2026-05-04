/**
 * 위치 1회 캡처 헬퍼.
 *
 * - 네이티브(Capacitor)면 @capacitor/geolocation, 웹이면 navigator.geolocation
 * - 권한 거부/타임아웃이어도 throw하지 않고 null 반환 → 호출자는 위치 없이도 진행 가능
 * - 백그라운드 추적 X. 액션 직전 1회만.
 * - timeout 5초 (모바일 GPS cold start 고려), maximumAge 60초 (직전 좌표 재사용 허용)
 */
export interface LocationCapture {
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  capturedAt: string; // ISO
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function getCapacitor(): CapacitorGlobal | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap ?? null;
}

export function isNativePlatform(): boolean {
  const cap = getCapacitor();
  return Boolean(cap?.isNativePlatform?.());
}

export function getNativePlatform(): 'ios' | 'android' | null {
  const cap = getCapacitor();
  if (!cap?.isNativePlatform?.()) return null;
  const p = cap.getPlatform?.();
  return p === 'ios' || p === 'android' ? p : null;
}

async function captureNative(): Promise<LocationCapture | null> {
  try {
    const mod = (await import('@capacitor/geolocation')) as {
      Geolocation: {
        checkPermissions: () => Promise<{ location: string }>;
        requestPermissions: () => Promise<{ location: string }>;
        getCurrentPosition: (opts: {
          enableHighAccuracy?: boolean;
          timeout?: number;
          maximumAge?: number;
        }) => Promise<{
          coords: { latitude: number; longitude: number; accuracy: number };
        }>;
      };
    };
    const { Geolocation } = mod;

    const status = await Geolocation.checkPermissions();
    if (status.location !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted') return null;
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 60_000,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
      capturedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function captureWeb(): Promise<LocationCapture | null> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return Promise.resolve(null);
  }
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

export async function captureLocationOnce(): Promise<LocationCapture | null> {
  if (isNativePlatform()) return captureNative();
  return captureWeb();
}
