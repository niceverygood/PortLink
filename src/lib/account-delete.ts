/**
 * 회원 탈퇴(soft delete) 도메인 로직.
 *
 * App Store 5.1.1(v) 대응 + 한국 PIPA 양립.
 * - PII는 익명화하고 status=SUSPENDED + deletedAt 기록 (사용자가 재로그인 못 함).
 * - Trip/Settlement/DispatchOrder는 세법 5년 보관 의무로 유지 (FK Restrict).
 * - 진행 중인 Trip이 있으면 거부 — 운송 의무 완료 후 탈퇴해야 한다.
 *
 * 호출은 본인 한정. 관리자 강제 탈퇴는 별도 함수가 필요(현재 미구현).
 */
import { AuditAction, TripStatus, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ok, err, type Result } from '@/lib/result';

export type AccountDeleteError =
  | 'NOT_FOUND'
  | 'ALREADY_DELETED'
  | 'ACTIVE_TRIP' // 진행 중 운송이 남아 있어 탈퇴 보류
  | 'PENDING_SETTLEMENT' // 미확정 정산이 남아 있어 탈퇴 보류 (포워더)
  | 'ADMIN_FORBIDDEN'; // 관리자는 본인 셀프 탈퇴 금지

const ACTIVE_TRIP_STATUSES: TripStatus[] = [
  TripStatus.PENDING,
  TripStatus.DEPARTED,
  TripStatus.LOADED,
  TripStatus.IN_TRANSIT,
  TripStatus.UNLOADED,
];

export async function deleteAccount(
  userId: string,
  context?: { ipAddress?: string; userAgent?: string },
): Promise<Result<{ userId: string }, AccountDeleteError>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { truckDriver: true },
  });
  if (!user) return err('NOT_FOUND');
  if (user.deletedAt) return err('ALREADY_DELETED');
  if (user.role === 'ADMIN') return err('ADMIN_FORBIDDEN');

  // 진행 중 운송 검사 (차주)
  if (user.truckDriver) {
    const activeTrip = await prisma.trip.count({
      where: {
        driverId: user.truckDriver.id,
        status: { in: ACTIVE_TRIP_STATUSES },
      },
    });
    if (activeTrip > 0) return err('ACTIVE_TRIP');
  }

  await prisma.$transaction(async (tx) => {
    // 1) User PII 익명화 + suspend
    //    phone은 '010-' 형식 제약과 충돌하지 않는 prefix로 갈아끼워 재가입 차단.
    await tx.user.update({
      where: { id: userId },
      data: {
        name: '탈퇴회원',
        email: null,
        phone: `deleted:${userId}`,
        passwordHash: null,
        status: UserStatus.SUSPENDED,
        deletedAt: new Date(),
      },
    });

    // 2) 역할별 프로필 PII 익명화
    if (user.truckDriver) {
      await tx.truckDriver.update({
        where: { userId },
        data: {
          licenseNo: null,
          bankName: null,
          bankAccount: null,
        },
      });
    }
    // Carrier/Forwarder는 사업자등록번호 등 법인 식별자라 개인 PII는 representative 1건뿐.
    // 사업자 자체는 거래 이력 추적용으로 유지하고, 대표자명만 익명화.
    const carrier = await tx.carrier.findUnique({ where: { userId } });
    if (carrier) {
      await tx.carrier.update({
        where: { userId },
        data: { representative: '탈퇴회원' },
      });
    }
    const forwarder = await tx.forwarder.findUnique({ where: { userId } });
    if (forwarder) {
      await tx.forwarder.update({
        where: { userId },
        data: { representative: '탈퇴회원', contactPhone: 'deleted' },
      });
    }

    // 3) Cascade로 자동 정리되지 않는 운영 데이터 명시적 삭제
    await tx.deviceToken.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.otpCode.deleteMany({ where: { phone: user.phone } });

    // 4) 감사 로그
    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        entity: 'User',
        entityId: userId,
        action: AuditAction.DELETE,
        before: {
          role: user.role,
          status: user.status,
        },
        after: {
          status: UserStatus.SUSPENDED,
          deletedAt: new Date().toISOString(),
        },
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
    });
  });

  return ok({ userId });
}
