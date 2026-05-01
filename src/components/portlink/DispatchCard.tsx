/**
 * 배차 카드 — 포워더(데스크탑 테이블 row)와 차주(모바일 카드) 양쪽에서 재사용.
 * variant로 톤 분기:
 *   - 'driver': 큰 hero 운임, rounded-3xl, 큰 패딩
 *   - 'forwarder': 절제된 padding, rounded-lg
 */
import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import type { ContainerType, PortCode } from '@prisma/client';
import { cn } from '@/lib/utils';
import { PriceDisplay } from './PriceDisplay';
import { PortBadge } from './PortBadge';
import { ContainerTypeIcon } from './ContainerTypeIcon';

interface Props {
  orderNo: string;
  originRegion: string;
  port: PortCode;
  containerType: ContainerType;
  pickupAt: Date;
  fare: number;
  variant?: 'driver' | 'forwarder';
  href?: string;
}

function formatPickup(at: Date): string {
  // KST 표시 — 시드/DB는 UTC 저장
  return at.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DispatchCard({
  orderNo,
  originRegion,
  port,
  containerType,
  pickupAt,
  fare,
  variant = 'driver',
  href,
}: Props) {
  const isDriver = variant === 'driver';

  const cardCls = isDriver
    ? 'rounded-3xl border bg-white p-5 shadow-sm'
    : 'rounded-lg border bg-white p-4 shadow-sm';

  const content = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-caption font-medium text-slate-500">{orderNo}</span>
        <ContainerTypeIcon type={containerType} size={isDriver ? 'lg' : 'md'} withLabel />
      </div>

      <div className="mb-4 flex items-start gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <div className="flex-1">
          <div className={cn('font-semibold text-slate-900', isDriver ? 'text-h2' : 'text-body')}>
            {originRegion}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-body-sm text-slate-500">
            <span>→</span>
            <PortBadge port={port} />
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-1.5 text-body-sm text-slate-500">
        <Calendar className="size-4" />
        <span>{formatPickup(pickupAt)}</span>
      </div>

      <div className={cn('flex items-end justify-between', isDriver ? 'pt-2' : '')}>
        <span className="text-caption text-slate-500">운임</span>
        <PriceDisplay
          amount={fare}
          size={isDriver ? 'hero' : 'lg'}
          tone={isDriver ? 'navy' : 'default'}
        />
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(cardCls, 'block transition-shadow hover:shadow-md')}>
        {content}
      </Link>
    );
  }
  return <div className={cardCls}>{content}</div>;
}
