import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export const metadata = { title: '가용 배차' };

export default async function DriverJobsPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-brand-navy px-4 py-4 text-white">
        <h1 className="text-h2 font-bold">가용 배차</h1>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <Button type="submit" variant="ghost" size="sm" className="text-white hover:bg-white/10">
            로그아웃
          </Button>
        </form>
      </header>

      <section className="p-4">
        <div className="rounded-3xl bg-brand-orange-light p-6">
          <p className="text-body font-semibold text-brand-navy">
            안녕하세요, {session?.user?.name} 차주님
          </p>
          <p className="mt-2 text-body-sm text-slate-700">
            현재 가용 배차 목록은 Stage 4에서 표시됩니다.
          </p>
        </div>
      </section>
    </main>
  );
}
