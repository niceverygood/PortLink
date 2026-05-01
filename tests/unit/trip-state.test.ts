import { describe, expect, it } from 'vitest';
import { TripStatus } from '@prisma/client';
import { canTransitionTripStatus, TRIP_STATUS_FLOW } from '@/lib/trip-state';
import { BUSINESS_RULES } from '@/config/business-rules';

const acceptedAt = new Date('2026-05-01T00:00:00Z');

describe('Trip 상태 머신', () => {
  it('정상 흐름 단방향 전환만 허용', () => {
    expect(
      canTransitionTripStatus({ from: TripStatus.PENDING, to: TripStatus.DEPARTED, acceptedAt }).ok,
    ).toBe(true);
    expect(
      canTransitionTripStatus({ from: TripStatus.DEPARTED, to: TripStatus.LOADED, acceptedAt }).ok,
    ).toBe(true);
    expect(
      canTransitionTripStatus({ from: TripStatus.LOADED, to: TripStatus.IN_TRANSIT, acceptedAt })
        .ok,
    ).toBe(true);
    expect(
      canTransitionTripStatus({ from: TripStatus.IN_TRANSIT, to: TripStatus.UNLOADED, acceptedAt })
        .ok,
    ).toBe(true);
    expect(
      canTransitionTripStatus({ from: TripStatus.UNLOADED, to: TripStatus.COMPLETED, acceptedAt })
        .ok,
    ).toBe(true);
  });

  it('역방향 / 건너뛰기 거부', () => {
    expect(
      canTransitionTripStatus({ from: TripStatus.DEPARTED, to: TripStatus.PENDING, acceptedAt }).ok,
    ).toBe(false);
    expect(
      canTransitionTripStatus({ from: TripStatus.PENDING, to: TripStatus.LOADED, acceptedAt }).ok,
    ).toBe(false);
    expect(
      canTransitionTripStatus({ from: TripStatus.PENDING, to: TripStatus.COMPLETED, acceptedAt })
        .ok,
    ).toBe(false);
  });

  it('COMPLETED / CANCELLED는 종착', () => {
    expect(TRIP_STATUS_FLOW[TripStatus.COMPLETED]).toEqual([]);
    expect(TRIP_STATUS_FLOW[TripStatus.CANCELLED]).toEqual([]);
  });

  it('CANCEL grace 5분 내면 차주 취소 OK', () => {
    const now = new Date(acceptedAt.getTime() + 4 * 60_000);
    const r = canTransitionTripStatus({
      from: TripStatus.PENDING,
      to: TripStatus.CANCELLED,
      acceptedAt,
      now,
    });
    expect(r.ok).toBe(true);
  });

  it('CANCEL grace 초과 시 차주 거부, 관리자는 OK', () => {
    const now = new Date(acceptedAt.getTime() + (BUSINESS_RULES.CANCEL_GRACE_MINUTES + 1) * 60_000);
    const r = canTransitionTripStatus({
      from: TripStatus.DEPARTED,
      to: TripStatus.CANCELLED,
      acceptedAt,
      now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('CANCEL_GRACE_EXCEEDED');

    const adminR = canTransitionTripStatus({
      from: TripStatus.DEPARTED,
      to: TripStatus.CANCELLED,
      acceptedAt,
      now,
      isAdmin: true,
    });
    expect(adminR.ok).toBe(true);
  });

  it('IN_TRANSIT 이후 CANCELLED는 머신상 불가', () => {
    expect(
      canTransitionTripStatus({
        from: TripStatus.IN_TRANSIT,
        to: TripStatus.CANCELLED,
        acceptedAt,
        isAdmin: true,
      }).ok,
    ).toBe(false);
  });
});
