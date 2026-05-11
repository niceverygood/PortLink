import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const metadata = { title: '포워더 가입 문의' };

export default function SignupForwarderPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-center text-h1 font-bold text-brand-navy">
        PortLink
      </Link>
      <h1 className="mb-2 text-h2 font-semibold">포워더·화주 가입 문의</h1>
      <p className="mb-6 text-body text-slate-600">
        포워더(화주) 계정은 사업자등록증 확인 절차를 거쳐 발급됩니다. 운영팀이 직접 응대하므로
        아래 채널로 연락 주세요.
      </p>
      <Alert>
        <AlertDescription>
          <div className="space-y-1">
            <p>· 이메일: support@portlink.kr</p>
            <p>· 평일 09:00 ~ 18:00 (KST)</p>
            <p>· 사업자등록증 사본을 첨부해 주시면 영업일 1일 이내 회신해 드립니다.</p>
          </div>
        </AlertDescription>
      </Alert>
      <Link href="/login" className="mt-6 text-center text-body-sm text-brand-navy underline">
        로그인 화면으로
      </Link>
    </main>
  );
}
