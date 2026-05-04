'use client';

import { useEffect } from 'react';
import { nativeFetch } from '@/lib/native-fetch';
import { getNativePlatform } from '@/lib/geolocation';

/**
 * 차주 layout에 mount.
 * - 네이티브(iOS/Android)일 때만 동작
 * - 권한 prompt → APNs/FCM 토큰 수신 → /api/notifications/register-device POST
 * - 권한 거부 시 조용히 종료 (best-effort)
 * - 알림 클릭 → 딥링크 처리는 NativeAppBridge가 담당 (appUrlOpen 또는 pushNotificationActionPerformed)
 */
export function PushRegistration() {
  useEffect(() => {
    const platform = getNativePlatform();
    if (!platform) return;

    let removers: Array<() => void> = [];
    let cancelled = false;

    void (async () => {
      try {
        const mod = (await import('@capacitor/push-notifications')) as {
          PushNotifications: {
            checkPermissions: () => Promise<{ receive: string }>;
            requestPermissions: () => Promise<{ receive: string }>;
            register: () => Promise<void>;
            addListener: (
              ev: string,
              cb: (data: { value?: string; error?: unknown }) => void,
            ) => Promise<{ remove: () => Promise<void> }>;
          };
        };
        const { PushNotifications } = mod;

        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
          if (perm.receive !== 'granted') return;
        }
        if (cancelled) return;

        const regSub = await PushNotifications.addListener('registration', (data) => {
          if (!data.value) return;
          void nativeFetch('/api/notifications/register-device', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              token: data.value,
              platform: platform.toUpperCase(),
              appBuild: process.env.NEXT_PUBLIC_APP_BUILD ?? null,
            }),
          }).catch(() => {
            // 등록 실패는 best-effort — 다음 앱 실행 시 재시도
          });
        });

        const errSub = await PushNotifications.addListener('registrationError', () => {
          // APNs 토큰 발급 실패 (시뮬레이터 등) — 무시
        });

        removers.push(() => void regSub.remove());
        removers.push(() => void errSub.remove());

        await PushNotifications.register();
      } catch {
        // @capacitor/push-notifications 미설치 또는 네이티브 미초기화 — 무시
      }
    })();

    return () => {
      cancelled = true;
      removers.forEach((r) => r());
      removers = [];
    };
  }, []);

  return null;
}
