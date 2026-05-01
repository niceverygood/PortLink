import { PortCode } from '@prisma/client';

const PORT_LABELS: Record<PortCode, string> = {
  [PortCode.BUSAN]: '부산',
  [PortCode.BUSAN_NEW]: '부산신항',
  [PortCode.INCHEON]: '인천',
  [PortCode.GWANGYANG]: '광양',
  [PortCode.PYEONGTAEK]: '평택',
};

const PORT_COLOR: Record<PortCode, string> = {
  [PortCode.BUSAN]: 'bg-blue-500',
  [PortCode.BUSAN_NEW]: 'bg-cyan-500',
  [PortCode.INCHEON]: 'bg-emerald-500',
  [PortCode.GWANGYANG]: 'bg-violet-500',
  [PortCode.PYEONGTAEK]: 'bg-amber-500',
};

interface Props {
  counts: Record<PortCode, number>;
}

export function PortDistributionBar({ counts }: Props) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <div className="text-caption text-slate-500">항만 분포</div>
        <div className="mt-3 text-body-sm text-slate-400">데이터 없음</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-caption text-slate-500">항만 분포 (이번 달)</div>
        <div className="text-caption tabular-nums text-slate-400">총 {total}건</div>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-md bg-slate-100">
        {(Object.keys(counts) as PortCode[]).map((port) => {
          const v = counts[port];
          if (v === 0) return null;
          const pct = (v / total) * 100;
          return (
            <div
              key={port}
              className={PORT_COLOR[port]}
              style={{ width: `${pct}%` }}
              title={`${PORT_LABELS[port]}: ${v}건`}
            />
          );
        })}
      </div>
      <ul className="mt-3 grid grid-cols-5 gap-2 text-caption">
        {(Object.keys(counts) as PortCode[]).map((port) => (
          <li key={port} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-sm ${PORT_COLOR[port]}`} />
            <span className="text-slate-600">{PORT_LABELS[port]}</span>
            <span className="ml-auto tabular-nums text-slate-900">{counts[port]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
