'use client';

import { useEffect, useState } from 'react';

/**
 * 오프라인 페이지 클라이언트:
 * - 1초마다 navigator.onLine 폴링 → 복구되면 location.reload()
 * - "다시 시도" 수동 버튼
 */
export function OfflineClient() {
  const [online, setOnline] = useState<boolean>(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setOnline(navigator.onLine);

    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);

    const tick = window.setInterval(() => {
      if (navigator.onLine) {
        // 직전 화면으로 복귀 시도
        if (document.referrer && document.referrer !== window.location.href) {
          window.location.replace(document.referrer);
        } else {
          window.location.replace('/driver/jobs');
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('online', onUp);
      window.removeEventListener('offline', onDown);
      window.clearInterval(tick);
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        disabled={retrying}
        onClick={() => {
          setRetrying(true);
          window.location.reload();
        }}
        className="w-full rounded-3xl bg-brand-orange py-4 text-h2 font-semibold text-white shadow-md hover:bg-brand-orange-dark disabled:opacity-60"
      >
        {retrying ? '재시도 중…' : '다시 시도'}
      </button>
      <p className="text-[11px] text-slate-500">
        네트워크 상태:{' '}
        <span className={online ? 'text-emerald-600' : 'text-rose-600'}>
          {online ? '연결됨' : '오프라인'}
        </span>
      </p>
    </div>
  );
}
