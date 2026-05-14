'use client';

/**
 * 회원 탈퇴 진입 버튼 + 2단계 확인 다이얼로그.
 *
 * App Store Guideline 5.1.1(v) — 앱 내에서 시작 → 확인 → 완료까지 끊김 없이 진행되어야 한다.
 *  1) 회원 탈퇴 버튼 (Step 1)
 *  2) 익명화 안내 + 키워드 "탈퇴" 입력 검증 (Step 2)
 *  3) 서버 POST → 성공 시 signOut + '/' 리다이렉트
 *
 * 진행 중 운송이 남아 있으면 서버가 ACTIVE_TRIP 코드로 거부한다.
 */

import { useState, useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isPending, startTransition] = useTransition();
  const canSubmit = confirmText.trim() === '탈퇴' && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    startTransition(async () => {
      try {
        const res = await fetch('/api/account/delete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ confirm: '탈퇴' }),
        });
        const json = (await res.json()) as
          | { ok: true; data: { deleted: boolean } }
          | { ok: false; error: { code: string; message: string } };

        if (!json.ok) {
          toast.error(json.error.message ?? '탈퇴 처리 실패');
          return;
        }

        toast.success('탈퇴가 완료되었습니다. 그동안 PortLink를 이용해 주셔서 감사합니다.');
        // 세션 종료 + 홈으로
        await signOut({ callbackUrl: '/' });
      } catch {
        toast.error('네트워크 오류로 탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        onClick={() => {
          setConfirmText('');
          setOpen(true);
        }}
      >
        회원 탈퇴
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[20rem] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600">회원 탈퇴</DialogTitle>
            <DialogDescription className="text-left text-body-sm leading-relaxed text-slate-700">
              탈퇴하면 즉시 다음 처리가 이뤄집니다.
              <br />
              <span className="mt-2 block">
                • 이름·이메일·휴대폰·계좌·자격증 정보는 즉시 익명화됩니다.
                <br />
                • 알림 토큰과 디바이스 정보는 즉시 삭제됩니다.
                <br />• 운송 이력·세금계산서는 화물자동차 운수사업법 및 세법(5년 보관 의무)에 따라
                익명 상태로 보관됩니다.
              </span>
              <span className="mt-2 block text-rose-600">
                탈퇴 후에는 같은 휴대폰 번호로 재가입할 수 없습니다.
              </span>
              <span className="mt-2 block">
                계속 진행하려면 아래 입력란에 <strong>탈퇴</strong>를 입력하세요.
              </span>
            </DialogDescription>
          </DialogHeader>

          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="탈퇴"
            aria-label="탈퇴 확인 문구"
            autoFocus
            disabled={isPending}
          />

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              {isPending ? '처리 중…' : '탈퇴하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
