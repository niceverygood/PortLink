import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const metadata = { title: '운송사 가입 문의' };

export default function SignupCarrierPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-center text-h1 font-bold text-brand-navy">
        PortLink
      </Link>
      <h1 className="mb-2 text-h2 font-semibold">운송사 가입 문의</h1>
      <p className="mb-6 text-body text-slate-600">
        운송사(자가운송사 포함) 계정은 화물자동차 운송주선사업 면허 확인 후 발급됩니다 (법정 절차).
        아래 채널로 연락 주시면 운영팀에서 응대해 드립니다.
      </p>
      <Alert>
        <AlertDescription>
          <div className="space-y-1">
            <p>· 이메일: support@portlink.kr</p>
            <p>· 평일 09:00 ~ 18:00 (KST)</p>
            <p>· 운송주선사업 면허증 사본을 첨부해 주시면 영업일 1일 이내 회신해 드립니다.</p>
          </div>
        </AlertDescription>
      </Alert>
      <Link href="/login" className="mt-6 text-center text-body-sm text-brand-navy underline">
        로그인 화면으로
      </Link>
    </main>
  );
}
