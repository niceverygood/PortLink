/**
 * 햅틱 피드백 — 네이티브에서만 동작.
 * 웹은 Vibration API fallback (지원되는 브라우저만), 미지원이면 silent.
 *
 * - light/medium/heavy: ImpactStyle 매핑
 * - success/warning/error: NotificationType 매핑
 */
import { isNativePlatform } from './geolocation';

type ImpactStyle = 'LIGHT' | 'MEDIUM' | 'HEAVY';
type NotifyType = 'SUCCESS' | 'WARNING' | 'ERROR';

async function impactNative(style: ImpactStyle) {
  try {
    const mod = (await import('@capacitor/haptics')) as {
      Haptics: { impact: (opts: { style: string }) => Promise<void> };
      ImpactStyle: Record<string, string>;
    };
    const styleVal = mod.ImpactStyle[style] ?? mod.ImpactStyle.Medium ?? 'MEDIUM';
    await mod.Haptics.impact({ style: styleVal });
  } catch {
    // 미설치 / 미지원
  }
}

async function notifyNative(type: NotifyType) {
  try {
    const mod = (await import('@capacitor/haptics')) as {
      Haptics: { notification: (opts: { type: string }) => Promise<void> };
      NotificationType: Record<string, string>;
    };
    const typeVal = mod.NotificationType[type] ?? mod.NotificationType.Success ?? 'SUCCESS';
    await mod.Haptics.notification({ type: typeVal });
  } catch {
    // 미설치 / 미지원
  }
}

function vibrateWeb(ms: number | number[]) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    (navigator as Navigator & { vibrate: (p: number | number[]) => boolean }).vibrate(ms);
  } catch {
    // ignore
  }
}

export function hapticLight() {
  if (isNativePlatform()) void impactNative('LIGHT');
  else vibrateWeb(10);
}

export function hapticMedium() {
  if (isNativePlatform()) void impactNative('MEDIUM');
  else vibrateWeb(20);
}

export function hapticHeavy() {
  if (isNativePlatform()) void impactNative('HEAVY');
  else vibrateWeb(40);
}

export function hapticSuccess() {
  if (isNativePlatform()) void notifyNative('SUCCESS');
  else vibrateWeb(15);
}

export function hapticError() {
  if (isNativePlatform()) void notifyNative('ERROR');
  else vibrateWeb([20, 50, 20]);
}
