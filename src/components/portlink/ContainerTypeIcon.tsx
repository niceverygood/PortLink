/**
 * 컨테이너 차종 아이콘 + 라벨.
 * SVG 한 종류(직사각형 컨테이너)에 차종 라벨 inline.
 * 표시 라벨은 prisma-enums.ts의 CONTAINER_TYPE_LABEL 사용 (40FT_HC → "40HC").
 */
import type { ContainerType } from '@prisma/client';
import { CONTAINER_TYPE_LABEL } from '@/lib/prisma-enums';
import { cn } from '@/lib/utils';

const SIZE = { sm: 16, md: 24, lg: 32, xl: 48 } as const;

interface Props {
  type: ContainerType;
  size?: keyof typeof SIZE;
  className?: string;
  withLabel?: boolean;
}

export function ContainerTypeIcon({ type, size = 'md', className, withLabel = false }: Props) {
  const px = SIZE[size];
  const label = CONTAINER_TYPE_LABEL[type];
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <svg
        width={px}
        height={px * 0.6}
        viewBox="0 0 40 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label={`${label} 컨테이너`}
      >
        <rect x="1" y="3" width="38" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path
          d="M6 7v10M11 7v10M16 7v10M21 7v10M26 7v10M31 7v10"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      {withLabel && <span className="text-caption font-medium tabular-nums">{label}</span>}
    </span>
  );
}
