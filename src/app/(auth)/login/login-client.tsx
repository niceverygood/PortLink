'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Kind = 'forwarder' | 'driver' | 'admin' | null;

interface Props {
  testLoginEnabled?: boolean;
}

export default function LoginPageClient({ testLoginEnabled = false }: Props) {
  const params = useSearchParams();
  const next = params.get('next') ?? '';
  const kind = (params.get('kind') as Kind) ?? null;
  const errorCode = params.get('error');

  // kind 파라미터 있으면 해당 폼만 노출 (랜딩에서 이미 분기 — 중복 탭 제거).
  // kind=null (직접 /login 접근)일 때만 탭으로 선택 가능.
  const showDriverOnly = kind === 'driver';
  const showBusinessOnly = kind === 'forwarder' || kind === 'admin';
  const showTabs = !showDriverOnly && !showBusinessOnly;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="mb-8 text-center text-h1 font-bold text-brand-navy">
          PortLink
        </Link>

        {kind && (
          <p className="mb-4 text-center text-body-sm text-slate-500">
            {kind === 'driver'
              ? '차주 로그인'
              : kind === 'admin'
                ? '관리자 로그인'
                : '담당자 로그인 (포워더 · 운송사)'}
          </p>
        )}

        {errorCode && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              로그인 실패 — 이메일/비밀번호 또는 인증번호를 확인하세요.
            </AlertDescription>
          </Alert>
        )}

        {showBusinessOnly && (
          <>
            <BusinessLoginForm callbackUrl={next || '/forwarder/dashboard'} />
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
            <p className="mt-2 text-center text-caption text-slate-400">
              차주이신가요?{' '}
              <Link href="/login?kind=driver" className="text-brand-orange underline">
                차주 로그인으로
              </Link>
            </p>
            {testLoginEnabled && <BusinessTestPanel next={next} />}
          </>
        )}

        {showDriverOnly && (
          <>
            <DriverLoginForm callbackUrl={next || '/driver/jobs'} />
            <p className="mt-4 text-center text-body-sm text-slate-500">
              계정이 없으신가요?{' '}
              <Link href="/signup/driver" className="text-brand-orange underline">
                차주 가입
              </Link>
            </p>
            <p className="mt-2 text-center text-caption text-slate-400">
              담당자이신가요?{' '}
              <Link href="/login?kind=forwarder" className="text-brand-navy underline">
                담당자 로그인으로
              </Link>
            </p>
            {testLoginEnabled && <DriverTestPanel next={next} />}
          </>
        )}

        {showTabs && (
          <Tabs defaultValue="business" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="business">담당자 로그인</TabsTrigger>
              <TabsTrigger value="driver">차주 로그인</TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="mt-4">
              <BusinessLoginForm callbackUrl={next || '/forwarder/dashboard'} />
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
              {testLoginEnabled && <BusinessTestPanel next={next} />}
            </TabsContent>

            <TabsContent value="driver" className="mt-4">
              <DriverLoginForm callbackUrl={next || '/driver/jobs'} />
              <p className="mt-4 text-center text-body-sm text-slate-500">
                계정이 없으신가요?{' '}
                <Link href="/signup/driver" className="text-brand-orange underline">
                  차주 가입
                </Link>
              </p>
              {testLoginEnabled && <DriverTestPanel next={next} />}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}

/**
 * 시연용 1-Click 로그인 — `SEED_PASSWORD` env가 있을 때만 노출.
 * 폼이 보이는 화면(담당자 vs 차주)에 맞춰 해당 역할의 계정만 표시.
 */
function useTestLogin(next: string) {
  const [pending, setPending] = useState<string | null>(null);

  async function login(kind: string, defaultRedirect: string) {
    setPending(kind);
    // redirect: true (기본) — NextAuth가 atomic하게 cookie 설정 + redirect 처리.
    // 실패 시 /login?error=...로 돌아옴.
    await signIn('test-login', {
      kind,
      callbackUrl: next || defaultRedirect,
    });
  }

  return { pending, login };
}

function TestPanelShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="mb-1 text-caption font-semibold text-amber-700">⚡ 시연용 1-Click 로그인</p>
      <p className="mb-3 text-caption text-amber-700/80">
        SEED_PASSWORD가 설정된 환경에서만 노출됩니다 (운영에선 비워서 자동 차단).
      </p>
      {children}
    </section>
  );
}

function BusinessTestPanel({ next }: { next: string }) {
  const { pending, login } = useTestLogin(next);
  return (
    <TestPanelShell>
      <div className="grid grid-cols-3 gap-2">
        <TestBtn
          label="관리자"
          sub="admin@portlink.kr"
          loading={pending === 'admin'}
          onClick={() => login('admin', '/admin/dashboard')}
        />
        <TestBtn
          label="포워더"
          sub="kim@hanjin-demo.kr"
          loading={pending === 'forwarder'}
          onClick={() => login('forwarder', '/forwarder/dashboard')}
        />
        <TestBtn
          label="운송사"
          sub="kim@inhouse-demo.kr"
          loading={pending === 'carrier'}
          onClick={() => login('carrier', '/forwarder/dashboard')}
        />
      </div>
    </TestPanelShell>
  );
}

function DriverTestPanel({ next }: { next: string }) {
  const { pending, login } = useTestLogin(next);
  const drivers = [1, 2, 3, 4, 5];
  return (
    <TestPanelShell>
      <div className="grid grid-cols-5 gap-1">
        {drivers.map((n) => (
          <TestBtn
            key={n}
            label={`D-000${n}`}
            small
            loading={pending === `driver-${n}`}
            onClick={() => login(`driver-${n}`, '/driver/jobs')}
          />
        ))}
      </div>
    </TestPanelShell>
  );
}

function TestBtn({
  label,
  sub,
  small,
  loading,
  onClick,
}: {
  label: string;
  sub?: string;
  small?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={
        'rounded border border-amber-300 bg-white px-2 transition-colors hover:bg-amber-100 disabled:opacity-50 ' +
        (small ? 'py-1.5 font-mono text-caption' : 'py-2 text-body-sm font-medium')
      }
    >
      {loading ? '…' : label}
      {sub && <div className="text-[10px] font-normal text-slate-500">{sub}</div>}
    </button>
  );
}

function BusinessLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // redirect: true (기본). 실패 시 /login?error=... 로 돌아오면 상위 errorCode로 표시.
    await signIn('email-password', { email, password, callbackUrl });
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

function DriverLoginForm({ callbackUrl }: { callbackUrl: string }) {
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
    setLoading(true);
    await signIn('phone-otp', { phone, code, callbackUrl });
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
