import { Topbar } from '@/components/forwarder/Topbar';

export const metadata = { title: '설정' };

export default function ForwarderSettingsPage() {
  return (
    <>
      <Topbar title="설정" subtitle="회사 정보, 알림 설정 등" />
      <div className="flex-1 overflow-y-auto p-8">
        <p className="text-[13px] text-slate-500">
          회사 정보, 알림 설정 등은 추후 단계에서 활성화됩니다.
        </p>
      </div>
    </>
  );
}
