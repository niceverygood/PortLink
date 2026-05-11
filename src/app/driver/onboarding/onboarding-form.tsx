'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeOnboarding } from './actions';

export function OnboardingForm({ skippable }: { skippable: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await completeOnboarding(formData);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.replace('/driver/jobs');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="licenseNo">화물운송종사자 자격증 번호</Label>
        <Input
          id="licenseNo"
          name="licenseNo"
          type="text"
          placeholder="예: 12345678-90"
          required
        />
        <p className="text-body-sm text-slate-500">
          국토교통부 발급 화물운송종사자 자격증에 표시된 번호를 입력하세요.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankName">은행</Label>
        <Input id="bankName" name="bankName" type="text" placeholder="예: 국민은행" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankAccount">계좌번호</Label>
        <Input
          id="bankAccount"
          name="bankAccount"
          type="text"
          inputMode="numeric"
          placeholder="숫자만 입력"
          required
        />
        <p className="text-body-sm text-slate-500">
          정산금 입금에 사용됩니다. 차주 본인 명의 계좌만 등록하세요.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-orange hover:bg-brand-orange-dark"
      >
        {pending ? '저장 중…' : '저장하고 시작하기'}
      </Button>

      {skippable && (
        <Link
          href="/driver/jobs"
          className="block text-center text-body-sm text-slate-500 underline"
        >
          나중에 입력하기 (화물 수락 전까지 등록 필요)
        </Link>
      )}
    </form>
  );
}
