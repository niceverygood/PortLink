/**
 * 알림 도메인 헬퍼.
 * Server Action / API route / 시드에서 모두 호출.
 */
import type { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * 단일 알림 생성. 실패해도 호출자 트랜잭션을 깨뜨리지 않게 best-effort:
 * Sentry로만 보고하고 throw하지 않는다.
 */
export async function createNotification(
  input: CreateNotificationInput,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  try {
    return await tx.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        metadata: input.metadata,
      },
    });
  } catch (e) {
    // 알림 실패가 본 액션을 막으면 안 됨. 로그만.
    console.error('[notifications] createNotification failed', e);
    return null;
  }
}

export async function getRecentNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markAsRead(opts: { userId: string; notificationId: string }) {
  // userId 일치 검증 + 멱등 (이미 읽은 건 noop)
  const updated = await prisma.notification.updateMany({
    where: {
      id: opts.notificationId,
      userId: opts.userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  return updated.count;
}

export async function markAllAsRead(userId: string) {
  const updated = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return updated.count;
}
