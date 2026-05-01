import { auth } from '@/lib/auth';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export const metadata = { title: '대시보드' };

export default async function ForwarderDashboardPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-h1 font-bold text-brand-navy">PortLink 대시보드</h1>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              로그아웃
            </Button>
          </form>
        </header>

        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-h2 font-semibold">환영합니다, {session?.user?.name} 담당자님</h2>
          <dl className="grid gap-2 text-body-sm text-slate-600">
            <div className="flex gap-2">
              <dt className="font-medium">역할:</dt>
              <dd>{session?.user?.role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">상태:</dt>
              <dd>{session?.user?.status}</dd>
            </div>
          </dl>
          <p className="mt-6 text-caption text-slate-400">
            Stage 5에서 KPI 카드 + 배차 목록 + 항만 분포가 추가됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}
