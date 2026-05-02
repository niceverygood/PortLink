import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface Props {
  title: string;
  subtitle?: string | null;
  /** 우측 상단 액션 (예: "+ 배차 등록" 버튼). 없으면 알림 + 로그아웃만. */
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.03em] text-brand-navy">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <NotificationBell variant="light" />
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
      </div>
    </header>
  );
}
