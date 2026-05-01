'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Truck, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/driver/jobs', label: '배차', Icon: LayoutGrid },
  { href: '/driver/trip', label: '운송중', Icon: Truck },
  { href: '/driver/settlement', label: '정산', Icon: Wallet },
  { href: '/driver/me', label: '내 정보', Icon: User },
] as const;

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="차주 메인 탭"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white"
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-caption transition-colors',
                  active ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-700',
                )}
              >
                <Icon className="size-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
