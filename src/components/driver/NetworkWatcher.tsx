'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { isNativePlatform } from '@/lib/geolocation';

/**
 * 네트워크 상태 변화 감지:
 *  - 네이티브: @capacitor/network로 connectionType + connected 모니터링
 *  - 웹: window online/offline 이벤트
 *
 * 끊김 → toast 안내. 복구 → toast 닫힘.
 */
export function NetworkWatcher() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let toastId: string | number | null = null;
    const showOffline = () => {
      if (toastId !== null) return;
      toastId = toast.error('네트워크 연결 끊김', {
        description: '연결이 복구되면 자동으로 동기화됩니다.',
        duration: Infinity,
      });
    };
    const clearOffline = () => {
      if (toastId !== null) {
        toast.dismiss(toastId);
        toastId = null;
        toast.success('네트워크 복구됨');
      }
    };

    let cleanup: (() => void) | null = null;

    if (isNativePlatform()) {
      void (async () => {
        try {
          const mod = (await import('@capacitor/network')) as {
            Network: {
              getStatus: () => Promise<{ connected: boolean; connectionType: string }>;
              addListener: (
                ev: string,
                cb: (s: { connected: boolean; connectionType: string }) => void,
              ) => Promise<{ remove: () => Promise<void> }>;
            };
          };
          const { Network } = mod;

          const status = await Network.getStatus();
          if (!status.connected) showOffline();

          const sub = await Network.addListener('networkStatusChange', (s) => {
            if (s.connected) clearOffline();
            else showOffline();
          });
          cleanup = () => void sub.remove();
        } catch {
          // 미설치 또는 네이티브 미초기화 — 웹 fallback
        }
      })();
    } else {
      const onUp = () => clearOffline();
      const onDown = () => showOffline();
      window.addEventListener('online', onUp);
      window.addEventListener('offline', onDown);
      if (!navigator.onLine) showOffline();
      cleanup = () => {
        window.removeEventListener('online', onUp);
        window.removeEventListener('offline', onDown);
      };
    }

    return () => {
      cleanup?.();
      if (toastId !== null) toast.dismiss(toastId);
    };
  }, []);

  return null;
}
