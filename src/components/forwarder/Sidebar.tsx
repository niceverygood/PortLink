'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, PlusSquare, Users, Wallet, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/forwarder/dashboard', label: '대시보드', Icon: LayoutDashboard },
  { href: '/forwarder/dispatch', label: '배차 목록', Icon: Truck },
  { href: '/forwarder/dispatch/new', label: '새 배차 등록', Icon: PlusSquare },
  { href: '/forwarder/drivers', label: '협력 차주', Icon: Users },
  { href: '/forwarder/settlement', label: '정산', Icon: Wallet },
  { href: '/forwarder/settings', label: '설정', Icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-brand-navy text-white lg:flex lg:flex-col">
      <div className="px-5 py-5">
        <Link href="/forwarder/dashboard" className="text-h2 font-bold tracking-tight">
          PortLink
        </Link>
        <div className="mt-1 text-caption text-white/60">컨테이너 운송 배차</div>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            href === '/forwarder/dispatch'
              ? pathname === href || pathname.startsWith('/forwarder/dispatch/')
              : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-body-sm transition-colors',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-caption text-white/40">
        © PortLink · 안전운임 보장
      </div>
    </aside>
  );
}
