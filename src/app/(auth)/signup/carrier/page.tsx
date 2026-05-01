import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const metadata = { title: '운송사 가입' };

export default function SignupCarrierPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-center text-h1 font-bold text-brand-navy">
        PortLink
      </Link>
      <h1 className="mb-2 text-h2 font-semibold">운송사 가입</h1>
      <p className="mb-6 text-body text-slate-600">
        운송사(자가운송사 포함) 계정은 관리자 승인 후 활성화됩니다.
      </p>
      <Alert>
        <AlertDescription>
          시연 환경에서는 시드 계정 (kim@inhouse-demo.kr)을 사용하세요. 정식 가입 플로우는 추후
          단계에서 활성화됩니다.
        </AlertDescription>
      </Alert>
      <Link href="/login" className="mt-6 text-center text-body-sm text-brand-navy underline">
        로그인 화면으로
      </Link>
    </main>
  );
}
