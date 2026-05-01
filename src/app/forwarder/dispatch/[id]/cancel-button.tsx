'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cancelDispatchAction } from './actions';

export function CancelButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-brand-error/40 text-brand-error hover:bg-brand-error/10"
        >
          배차 취소
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>배차 취소</DialogTitle>
          <DialogDescription>
            취소 시 배정된 차주에게 알림이 가며 정산은 발생하지 않습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">취소 사유 (선택)</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {err && <div className="text-body-sm text-brand-error">{err}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            돌아가기
          </Button>
          <Button
            disabled={pending}
            className="bg-brand-error text-white hover:bg-brand-error/90"
            onClick={() =>
              startTransition(async () => {
                setErr(null);
                const res = await cancelDispatchAction({ tripId, reason: reason || undefined });
                if (!res.ok) {
                  setErr(res.message ?? '취소 실패');
                  return;
                }
                setOpen(false);
                router.refresh();
              })
            }
          >
            {pending ? '취소 중…' : '취소 확정'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
