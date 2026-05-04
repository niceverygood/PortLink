'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { TripStatus } from '@prisma/client';
import { captureLocationOnce } from '@/lib/geolocation';
import { hapticLight, hapticSuccess, hapticError } from '@/lib/haptics';
import { updateTripStatusAction } from '../actions';

export function TripActionButton({
  tripId,
  nextStatus,
  label,
}: {
  tripId: string;
  nextStatus: TripStatus;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  return (
    <div>
      {err && (
        <div className="mb-2 rounded-lg bg-brand-error/10 px-4 py-2 text-body-sm text-brand-error">
          {err}
        </div>
      )}
      <button
        type="button"
        disabled={pending || capturing}
        onClick={() => {
          hapticLight();
          setCapturing(true);
          // 위치 capture는 best-effort — 거부/타임아웃이어도 액션은 진행.
          void captureLocationOnce().then((location) => {
            setCapturing(false);
            startTransition(async () => {
              setErr(null);
              const res = await updateTripStatusAction({ tripId, nextStatus, location });
              if (!res.ok) {
                hapticError();
                setErr(res.message ?? '상태 변경 실패');
                return;
              }
              hapticSuccess();
              router.refresh();
            });
          });
        }}
        className="w-full rounded-3xl bg-brand-orange py-4 text-h2 font-semibold text-white shadow-md transition-colors hover:bg-brand-orange-dark disabled:opacity-60"
      >
        {capturing ? '위치 확인 중…' : pending ? '처리 중…' : label}
      </button>
      <p className="mt-1 text-center text-[10.5px] text-slate-400">
        위치는 액션 시점 1회만 기록 (백그라운드 추적 X)
      </p>
    </div>
  );
}
