import { Topbar } from '@/components/forwarder/Topbar';

export const metadata = { title: '서류' };

export default function ForwarderDocumentsPage() {
  return (
    <>
      <Topbar title="서류" subtitle="세금계산서·운송계약서" />
      <div className="flex-1 overflow-y-auto p-8">
        <p className="text-[13px] text-slate-500">서류 보관함은 추후 단계에서 활성화됩니다.</p>
      </div>
    </>
  );
}
