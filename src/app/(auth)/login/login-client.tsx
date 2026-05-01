'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Kind = 'forwarder' | 'driver' | 'admin' | null;

export default function LoginPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '';
  const kind = (params.get('kind') as Kind) ?? null;

  const defaultTab = kind === 'driver' ? 'driver' : 'business';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="mb-8 text-center text-h1 font-bold text-brand-navy">
          PortLink
        </Link>

        {kind && (
          <Alert className="mb-4">
            <AlertDescription>
              {kind === 'driver'
                ? '차주 로그인 후 이용 가능한 페이지입니다.'
                : kind === 'admin'
                  ? '관리자 로그인이 필요합니다.'
                  : '담당자 로그인 후 이용 가능한 페이지입니다.'}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="business">담당자 로그인</TabsTrigger>
            <TabsTrigger value="driver">차주 로그인</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="mt-4">
            <BusinessLoginForm onSuccess={() => router.push(next || '/forwarder/dashboard')} />
            <p className="mt-4 text-center text-body-sm text-slate-500">
              계정이 없으신가요?{' '}
              <Link href="/signup/forwarder" className="text-brand-navy underline">
                포워더 가입
              </Link>{' '}
              ·{' '}
              <Link href="/signup/carrier" className="text-brand-navy underline">
                운송사 가입
              </Link>
            </p>
          </TabsContent>

          <TabsContent value="driver" className="mt-4">
            <DriverLoginForm onSuccess={() => router.push(next || '/driver/jobs')} />
            <p className="mt-4 text-center text-body-sm text-slate-500">
              계정이 없으신가요?{' '}
              <Link href="/signup/driver" className="text-brand-orange underline">
                차주 가입
              </Link>
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function BusinessLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('email-password', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-navy hover:bg-brand-navy-dark"
      >
        {loading ? '로그인 중…' : '로그인'}
      </Button>
    </form>
  );
}

function DriverLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
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
        setError(json.error?.message ?? '요청 실패');
        return;
      }
      setStep('code');
      setInfo('인증번호가 발송되었습니다 (개발 모드: 서버 콘솔 확인).');
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('phone-otp', {
      phone,
      code,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('인증번호가 올바르지 않거나 만료되었습니다.');
      return;
    }
    onSuccess();
  }

  return (
    <form
      onSubmit={step === 'phone' ? requestCode : verify}
      className="space-y-4 rounded-lg border bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="phone">휴대폰 번호</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="010-0000-0000"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={step === 'code'}
          required
        />
      </div>
      {step === 'code' && (
        <div className="space-y-2">
          <Label htmlFor="code">인증번호 (6자리)</Label>
          <Input
            id="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />
        </div>
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
        className="w-full bg-brand-orange py-3.5 hover:bg-brand-orange-dark"
      >
        {loading ? '처리 중…' : step === 'phone' ? '인증번호 받기' : '로그인'}
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
          className="w-full text-center text-body-sm text-slate-500 underline"
        >
          번호 다시 입력
        </button>
      )}
    </form>
  );
}
