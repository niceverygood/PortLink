import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { REGIONS } from '@/config/regions';
import { NewDispatchForm } from './new-dispatch-form';

export const metadata = { title: '새 배차 등록' };

export default async function NewDispatchPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=forwarder');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-h1 font-semibold text-slate-900">새 배차 등록</h1>
        <p className="mt-1 text-body-sm text-slate-500">3단계로 빠르게 등록</p>
      </div>
      <NewDispatchForm regions={REGIONS.map((r) => ({ name: r.name, province: r.province }))} />
    </div>
  );
}
