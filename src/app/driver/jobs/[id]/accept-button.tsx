'use client';

import { useTransition, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { acceptOrderAction } from '../actions';

export function AcceptButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      {err && (
        <div className="mb-2 rounded-lg bg-brand-error/10 px-4 py-2 text-[13px] text-brand-error">
          {err}
        </div>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setErr(null);
            const res = await acceptOrderAction(orderId);
            if (!res.ok) setErr(res.message ?? '수락 실패');
          })
        }
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-orange py-4 text-[16px] font-bold text-white shadow-md transition-colors hover:bg-brand-orange-dark disabled:opacity-60"
      >
        {pending ? (
          '수락 처리 중…'
        ) : (
          <>
            이 배차 수락하기
            <ArrowRight className="size-[18px]" strokeWidth={3} />
          </>
        )}
      </button>
    </div>
  );
}
