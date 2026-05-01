'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  AuditAction,
  ContainerType,
  DispatchOrderStatus,
  PortCode,
  Prisma,
  UserRole,
} from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSafeRate } from '@/lib/safe-rate';
import { validateFareWithinLimit } from '@/lib/settlements';
import { generateOrderNo } from '@/lib/dispatch-orders';

const Input = z.object({
  originRegion: z.string().min(1),
  originAddress: z.string().min(1),
  port: z.nativeEnum(PortCode),
  containerType: z.nativeEnum(ContainerType),
  pickupAt: z.string().min(1),
  fare: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export type CreateState = { ok: true; orderId: string } | { ok: false; message: string };

export async function createDispatchOrderAction(
  input: z.infer<typeof Input>,
): Promise<CreateState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.FORWARDER) {
    return { ok: false, message: '포워더 권한이 필요합니다' };
  }

  const parsed = Input.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? '입력 형식 오류' };
  }
  const data = parsed.data;
  const pickupAt = new Date(data.pickupAt);
  if (Number.isNaN(pickupAt.getTime())) {
    return { ok: false, message: '상차 시각이 올바르지 않습니다' };
  }

  const safeRate = await getSafeRate({
    originRegion: data.originRegion,
    port: data.port,
    containerType: data.containerType,
  });
  const fareCheck = validateFareWithinLimit(data.fare, safeRate?.baseFare ?? null);
  if (!fareCheck.ok) {
    if (fareCheck.error === 'BELOW_LEGAL_MIN') {
      return {
        ok: false,
        message: `안전운임 한도(${safeRate?.baseFare?.toLocaleString('ko-KR')}원의 90%) 미만으로 등록할 수 없습니다`,
      };
    }
    return { ok: false, message: '운임 형식 오류' };
  }

  const create = async () => {
    const orderNo = await generateOrderNo();
    return prisma.dispatchOrder.create({
      data: {
        orderNo,
        forwarderUserId: session.user.id,
        originRegion: data.originRegion,
        originAddress: data.originAddress,
        port: data.port,
        containerType: data.containerType,
        pickupAt,
        fare: data.fare,
        notes: data.notes,
        status: DispatchOrderStatus.OPEN,
      },
    });
  };

  let order;
  try {
    order = await create();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      order = await create();
    } else throw e;
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      entity: 'DispatchOrder',
      entityId: order.id,
      action: AuditAction.CREATE,
      after: { orderNo: order.orderNo, fare: order.fare },
    },
  });

  revalidatePath('/forwarder/dispatch');
  revalidatePath('/forwarder/dashboard');
  redirect(`/forwarder/dispatch/${order.id}`);
}

const SafeRateInput = z.object({
  originRegion: z.string().min(1),
  port: z.nativeEnum(PortCode),
  containerType: z.nativeEnum(ContainerType),
});

export async function fetchSafeRateAction(
  input: z.infer<typeof SafeRateInput>,
): Promise<{ ok: true; baseFare: number | null } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: '로그인이 필요합니다' };

  const parsed = SafeRateInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: '입력 형식 오류' };

  const rate = await getSafeRate(parsed.data);
  return { ok: true, baseFare: rate?.baseFare ?? null };
}
