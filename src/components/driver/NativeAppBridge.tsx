'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 네이티브 앱 진입 후 처리:
 *   1. Universal Link / 커스텀 스킴(portlink://...) 진입 → 앱 내부 라우팅으로 변환
 *   2. App 상태 변화(foreground 복귀) 시 router.refresh() — 알림 즉시 반영
 *
 * 웹(브라우저) 환경에서는 아무것도 하지 않음.
 */
export function NativeAppBridge() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    let cleanup: (() => void) | null = null;

    void (async () => {
      try {
        const mod = (await import('@capacitor/app')) as {
          App: {
            addListener: (
              ev: string,
              cb: (data: { url?: string; isActive?: boolean }) => void,
            ) => Promise<{ remove: () => Promise<void> }>;
          };
        };
        const { App } = mod;

        const urlSub = await App.addListener('appUrlOpen', (data) => {
          if (!data.url) return;
          try {
            const u = new URL(data.url);
            // portlink://trip/abc → /driver/trip/abc 매핑
            // https://portlink.kr/driver/trip/abc → /driver/trip/abc 그대로
            let path: string;
            if (u.protocol === 'portlink:') {
              const seg = (u.host + u.pathname).replace(/^\/+/, '');
              if (seg.startsWith('driver/')) {
                path = '/' + seg + (u.search || '');
              } else if (
                seg.startsWith('trip/') ||
                seg.startsWith('jobs/') ||
                seg.startsWith('settlement') ||
                seg.startsWith('report') ||
                seg.startsWith('me')
              ) {
                path = '/driver/' + seg + (u.search || '');
              } else {
                path = '/driver/jobs';
              }
            } else {
              path = u.pathname + u.search;
            }
            // /admin /forwarder는 차주 앱에서 막음
            if (path.startsWith('/admin') || path.startsWith('/forwarder')) {
              path = '/driver/jobs';
            }
            router.push(path);
          } catch {
            // 잘못된 URL — 무시
          }
        });

        const stateSub = await App.addListener('appStateChange', (s) => {
          if (s.isActive) router.refresh();
        });

        cleanup = () => {
          void urlSub.remove();
          void stateSub.remove();
        };
      } catch {
        // @capacitor/app 미설치 (웹) — 무시
      }
    })();

    return () => {
      cleanup?.();
    };
  }, [router]);

  return null;
}
