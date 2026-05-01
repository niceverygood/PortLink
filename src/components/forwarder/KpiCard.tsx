import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}

export function KpiCard({ label, value, hint, className }: Props) {
  return (
    <div className={cn('rounded-lg border bg-white p-4 shadow-sm', className)}>
      <div className="text-caption text-slate-500">{label}</div>
      <div className="mt-1 text-h1 font-semibold tabular-nums text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-caption text-slate-400">{hint}</div>}
    </div>
  );
}
