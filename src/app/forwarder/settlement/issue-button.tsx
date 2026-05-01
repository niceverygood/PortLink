'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { issueSettlementAction } from './actions';

export function IssueButton({ settlementId }: { settlementId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        size="sm"
        disabled={pending}
        className="bg-brand-navy hover:bg-brand-navy-dark"
        onClick={() =>
          startTransition(async () => {
            setErr(null);
            const res = await issueSettlementAction(settlementId);
            if (!res.ok) {
              setErr(res.message ?? '발행 실패');
              return;
            }
            router.refresh();
          })
        }
      >
        {pending ? '발행 중…' : '확정 발행'}
      </Button>
      {err && <span className="text-caption text-brand-error">{err}</span>}
    </span>
  );
}
