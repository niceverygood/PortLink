'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TripStatus } from '@prisma/client';
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

  return (
    <div>
      {err && (
        <div className="mb-2 rounded-lg bg-brand-error/10 px-4 py-2 text-body-sm text-brand-error">
          {err}
        </div>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setErr(null);
            const res = await updateTripStatusAction({ tripId, nextStatus });
            if (!res.ok) {
              setErr(res.message ?? '상태 변경 실패');
              return;
            }
            router.refresh();
          })
        }
        className="w-full rounded-3xl bg-brand-orange py-4 text-h2 font-semibold text-white shadow-md transition-colors hover:bg-brand-orange-dark disabled:opacity-60"
      >
        {pending ? '처리 중…' : label}
      </button>
    </div>
  );
}
