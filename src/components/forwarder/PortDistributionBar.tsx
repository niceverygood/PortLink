import { PortCode } from '@prisma/client';

const PORT_LABELS: Record<PortCode, string> = {
  [PortCode.BUSAN]: '부산항',
  [PortCode.BUSAN_NEW]: '부산신항',
  [PortCode.INCHEON]: '인천항',
  [PortCode.GWANGYANG]: '광양항',
  [PortCode.PYEONGTAEK]: '평택항',
};

interface Props {
  counts: Record<PortCode, number>;
}

export function PortDistributionBar({ counts }: Props) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const rows = (Object.keys(counts) as PortCode[])
    .map((p) => ({ port: p, count: counts[p] }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5">
      <p className="mb-3 text-[12px] font-bold text-brand-navy">항만별 분포</p>
      {total === 0 ? (
        <p className="text-[12px] text-slate-400">데이터 없음</p>
      ) : (
        rows.map(({ port, count }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={port} className="mb-2.5 last:mb-0">
              <div className="mb-1 flex justify-between text-[11.5px]">
                <span className="text-slate-700">{PORT_LABELS[port]}</span>
                <span className="font-semibold tabular-nums text-brand-navy">{count}건</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-navy transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
