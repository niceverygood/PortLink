import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { REGIONS } from '@/config/regions';
import { Topbar } from '@/components/forwarder/Topbar';
import { NewDispatchForm } from './new-dispatch-form';

export const metadata = { title: '배차 등록' };

export default async function NewDispatchPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=forwarder');

  return (
    <>
      <Topbar title="배차 등록" subtitle="안전운임제 기준 운임이 자동 계산됩니다" />
      <div className="flex-1 overflow-y-auto p-8">
        <NewDispatchForm regions={REGIONS.map((r) => ({ name: r.name, province: r.province }))} />
      </div>
    </>
  );
}
