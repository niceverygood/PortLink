/**
 * 항만 5종 컬러 코드 뱃지.
 */
import { PortCode } from '@prisma/client';
import { cn } from '@/lib/utils';

const PORT_LABEL: Record<PortCode, string> = {
  [PortCode.BUSAN]: '부산항',
  [PortCode.BUSAN_NEW]: '부산신항',
  [PortCode.INCHEON]: '인천항',
  [PortCode.GWANGYANG]: '광양항',
  [PortCode.PYEONGTAEK]: '평택항',
};

const PORT_CLS: Record<PortCode, string> = {
  [PortCode.BUSAN]: 'bg-blue-50 text-blue-700 ring-blue-200',
  [PortCode.BUSAN_NEW]: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  [PortCode.INCHEON]: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  [PortCode.GWANGYANG]: 'bg-violet-50 text-violet-700 ring-violet-200',
  [PortCode.PYEONGTAEK]: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function PortBadge({ port, className }: { port: PortCode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-caption font-medium ring-1',
        PORT_CLS[port],
        className,
      )}
    >
      {PORT_LABEL[port]}
    </span>
  );
}

export const PORT_LABEL_MAP = PORT_LABEL;
