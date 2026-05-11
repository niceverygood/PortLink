'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiErr, apiOk, type ApiResult } from '@/lib/result';

const Body = z.object({
  licenseNo: z
    .string()
    .trim()
    .min(6, '자격증 번호를 정확히 입력하세요')
    .max(40, '자격증 번호가 너무 깁니다'),
  bankName: z.string().trim().min(1, '은행명을 입력하세요').max(40),
  bankAccount: z
    .string()
    .trim()
    .min(8, '계좌번호를 정확히 입력하세요')
    .max(40, '계좌번호가 너무 깁니다'),
});

export type OnboardingResult = ApiResult<{ completed: true }>;

export async function completeOnboarding(formData: FormData): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) return apiErr('UNAUTHORIZED', '로그인이 필요합니다.');

  const parsed = Body.safeParse({
    licenseNo: formData.get('licenseNo'),
    bankName: formData.get('bankName'),
    bankAccount: formData.get('bankAccount'),
  });
  if (!parsed.success) {
    return apiErr('INVALID_INPUT', parsed.error.issues[0]?.message ?? '입력값을 확인하세요');
  }

  try {
    await prisma.truckDriver.update({
      where: { userId: session.user.id },
      data: {
        licenseNo: parsed.data.licenseNo,
        bankName: parsed.data.bankName,
        bankAccount: parsed.data.bankAccount,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return apiErr('LICENSE_ALREADY_REGISTERED', '이미 등록된 자격증 번호입니다.');
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return apiErr('NOT_DRIVER', '차주 프로필이 없습니다.');
    }
    console.error('[onboarding] unexpected error', e);
    return apiErr('INTERNAL', '저장 중 오류가 발생했습니다.');
  }

  revalidatePath('/driver/me');
  return apiOk({ completed: true });
}
