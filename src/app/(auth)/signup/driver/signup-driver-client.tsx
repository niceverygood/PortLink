'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'phone' | 'code';

export function SignupDriverClient() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<Step>('phone');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? '인증번호 요청에 실패했습니다.');
        return;
      }
      setStep('code');
      setInfo('인증번호가 발송되었습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function submitSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const signupRes = await fetch('/api/auth/signup/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, name: name.trim() || undefined }),
      });
      const signupJson = await signupRes.json();
      if (!signupJson.ok) {
        const errCode = signupJson.error?.code as string | undefined;
        if (errCode === 'PHONE_ALREADY_REGISTERED') {
          setError('이미 가입된 번호입니다. 로그인 화면에서 같은 번호로 로그인해 주세요.');
        } else {
          setError(signupJson.error?.message ?? '가입에 실패했습니다.');
        }
        return;
      }
      // 가입 성공 → 같은 phone+code로 NextAuth signIn (OTP 소진 + 세션 발급)
      await signIn('phone-otp', { phone, code, callbackUrl: '/driver/onboarding' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={step === 'phone' ? requestCode : submitSignup}
      className="space-y-4 rounded-lg border bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="phone">휴대폰 번호</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="010-XXXX-XXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={step === 'code'}
          required
        />
      </div>

      {step === 'code' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">이름 (선택)</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">인증번호</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6자리 숫자"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
        </>
      )}

      {info && (
        <Alert>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-orange hover:bg-brand-orange-dark"
      >
        {loading
          ? '처리 중…'
          : step === 'phone'
            ? '인증번호 받기'
            : '가입하고 시작하기'}
      </Button>

      {step === 'code' && (
        <button
          type="button"
          onClick={() => {
            setStep('phone');
            setCode('');
            setError(null);
            setInfo(null);
          }}
          className="block w-full text-center text-body-sm text-slate-500 underline"
        >
          휴대폰 번호 변경
        </button>
      )}

      <Link href="/login" className="block text-center text-body-sm text-brand-orange underline">
        이미 가입한 차주이신가요? 로그인
      </Link>
    </form>
  );
}
