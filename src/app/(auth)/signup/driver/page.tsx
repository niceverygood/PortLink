import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const metadata = { title: '차주 가입' };

export default function SignupDriverPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-center text-h1 font-bold text-brand-orange">
        PortLink Driver
      </Link>
      <h1 className="mb-2 text-h2 font-semibold">차주 가입</h1>
      <p className="mb-6 text-body text-slate-600">
        차주 가입은 관리자 승인(자격증·차량 확인) 후 활성화됩니다.
      </p>
      <Alert>
        <AlertDescription>
          시연 환경에서는 시드 차주 계정 (010-3000-0001 ~ 010-3000-0005)을 사용하세요. OTP는 서버
          콘솔에 출력됩니다.
        </AlertDescription>
      </Alert>
      <Link href="/login" className="mt-6 text-center text-body-sm text-brand-orange underline">
        차주 로그인으로
      </Link>
    </main>
  );
}
