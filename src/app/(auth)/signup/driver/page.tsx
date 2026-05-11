import Link from 'next/link';
import { SignupDriverClient } from './signup-driver-client';

export const metadata = { title: '차주 가입' };

export default function SignupDriverPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-center text-h1 font-bold text-brand-orange">
        PortLink Driver
      </Link>
      <h1 className="mb-2 text-h2 font-semibold">차주 가입</h1>
      <p className="mb-6 text-body text-slate-600">
        휴대폰 OTP로 즉시 가입할 수 있습니다. 첫 화물 수락 전, 화물자동차 운수사업법에 따른
        화물운송종사자 자격증 확인 절차가 1회 진행됩니다 (법정 절차).
      </p>
      <SignupDriverClient />
    </main>
  );
}
