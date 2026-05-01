'use client';

import { useEffect } from 'react';

/**
 * /driver 영역에서만 service worker 등록.
 * scope를 /driver/로 제한 — 포워더 화면에 영향 없음.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker
      .register('/driver-sw.js', { scope: '/driver/' })
      .catch((e) => console.warn('SW 등록 실패', e));
  }, []);

  return null;
}
