/**
 * 도메인 공유 컴포넌트 7종 — 렌더 + 핵심 텍스트/접근성 검증.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContainerType, PortCode, TripStatus } from '@prisma/client';
import { PriceDisplay } from '@/components/portlink/PriceDisplay';
import { TripStatusBadge, TRIP_STATUS_LABEL } from '@/components/portlink/TripStatusBadge';
import { PortBadge, PORT_LABEL_MAP } from '@/components/portlink/PortBadge';
import { ContainerTypeIcon } from '@/components/portlink/ContainerTypeIcon';
import { DriverAvatar } from '@/components/portlink/DriverAvatar';
import { DispatchCard } from '@/components/portlink/DispatchCard';
import { TimelineStepper } from '@/components/portlink/TimelineStepper';

describe('PriceDisplay', () => {
  it('천단위 콤마 + 원', () => {
    render(<PriceDisplay amount={800000} />);
    expect(screen.getByText('800,000원')).toBeInTheDocument();
  });

  it('hero size + tone 클래스 모두 유지 (twMerge 확장 검증)', () => {
    const { container } = render(<PriceDisplay amount={1234567} size="hero" tone="orange" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('1,234,567원');
    expect(span?.className).toMatch(/text-display/);
    expect(span?.className).toMatch(/text-brand-orange/);
    expect(span?.className).toMatch(/font-bold/);
    expect(span?.className).toMatch(/tabular-nums/);
  });
});

describe('TripStatusBadge', () => {
  it('7단계 모두 라벨 매핑', () => {
    for (const status of Object.values(TripStatus)) {
      expect(TRIP_STATUS_LABEL[status]).toBeTruthy();
    }
  });

  it('IN_TRANSIT 라벨 = "이동중"', () => {
    render(<TripStatusBadge status={TripStatus.IN_TRANSIT} />);
    expect(screen.getByText('이동중')).toBeInTheDocument();
  });
});

describe('PortBadge', () => {
  it('5항만 모두 라벨 존재', () => {
    for (const port of Object.values(PortCode)) {
      expect(PORT_LABEL_MAP[port]).toBeTruthy();
    }
  });

  it('부산항 렌더', () => {
    render(<PortBadge port={PortCode.BUSAN} />);
    expect(screen.getByText('부산항')).toBeInTheDocument();
  });
});

describe('ContainerTypeIcon', () => {
  it('40FT_HC 라벨 = "40HC"', () => {
    render(<ContainerTypeIcon type={ContainerType.FORTY_FT_HC} withLabel />);
    expect(screen.getByText('40HC')).toBeInTheDocument();
  });
});

describe('DriverAvatar', () => {
  it('이름 첫 글자 + rating', () => {
    render(<DriverAvatar name="이차주" rating={4.8} vehicleType="40FT" />);
    expect(screen.getByText('이')).toBeInTheDocument();
    expect(screen.getByText('이차주')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('40FT')).toBeInTheDocument();
  });
});

describe('DispatchCard', () => {
  it('운임 + 출발지 + 항만 표시', () => {
    render(
      <DispatchCard
        orderNo="D26-9999"
        originRegion="경기 평택"
        port={PortCode.BUSAN}
        containerType={ContainerType.FORTY_FT}
        pickupAt={new Date('2026-05-06T05:00:00Z')}
        fare={750_000}
      />,
    );
    expect(screen.getByText('D26-9999')).toBeInTheDocument();
    expect(screen.getByText('경기 평택')).toBeInTheDocument();
    expect(screen.getByText('부산항')).toBeInTheDocument();
    expect(screen.getByText('750,000원')).toBeInTheDocument();
  });
});

describe('TimelineStepper', () => {
  it('IN_TRANSIT 시 이동중 step 하이라이트', () => {
    render(<TimelineStepper current={TripStatus.IN_TRANSIT} />);
    expect(screen.getByText('이동중')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('CANCELLED는 별도 메시지', () => {
    render(<TimelineStepper current={TripStatus.CANCELLED} />);
    expect(screen.getByText('취소된 운송입니다')).toBeInTheDocument();
  });
});
