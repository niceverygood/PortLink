import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';

interface Props {
  userName: string;
  companyName?: string | null;
}

export function Topbar({ userName, companyName }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div>
        {companyName && <div className="text-caption text-slate-500">{companyName}</div>}
        <div className="text-body-sm font-medium text-slate-900">{userName} 담당자님</div>
      </div>
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
  );
}
