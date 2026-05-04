/**
 * APNs(HTTP/2) 푸시 발송.
 *
 * - Apple Developer 콘솔에서 Auth Key(.p8) 발급 → 환경변수 3개 등록 필수:
 *     APNS_TEAM_ID         (10자, ex. ABCDE12345)
 *     APNS_KEY_ID          (10자, .p8 파일 이름의 AuthKey_XXXXXXXXXX 부분)
 *     APNS_AUTH_KEY        (.p8 파일 내용 — BEGIN/END PRIVATE KEY 포함, \n 보존)
 *     APNS_BUNDLE_ID       (default kr.portlink.driver)
 *     APNS_USE_SANDBOX     ('1'이면 sandbox, 그 외 production)
 *
 * - JWT(ES256) 캐시: 같은 token으로 30~60분 유효. 동시성 안전성 위해 단순 유효시간 캐시.
 * - Vercel Lambda 환경에서 fetch API + crypto.subtle 사용 (외부 의존 0)
 *
 * 한계:
 *  - HTTP/2 multiplex가 fetch 기본은 아님. v8 fetch는 HTTP/2 지원 → Apple 서버 OK.
 *  - 실패 토큰(BadDeviceToken, Unregistered)은 DeviceToken.lastError에 기록 후 revoke.
 */
import { createPrivateKey, createSign } from 'node:crypto';
import { prisma } from '@/lib/db';

const APNS_HOST_PROD = 'https://api.push.apple.com';
const APNS_HOST_DEV = 'https://api.sandbox.push.apple.com';

interface ApnsConfig {
  teamId: string;
  keyId: string;
  authKey: string;
  bundleId: string;
  host: string;
}

function readConfig(): ApnsConfig | null {
  const teamId = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const authKey = process.env.APNS_AUTH_KEY;
  const bundleId = process.env.APNS_BUNDLE_ID ?? 'kr.portlink.driver';
  const host = process.env.APNS_USE_SANDBOX === '1' ? APNS_HOST_DEV : APNS_HOST_PROD;
  if (!teamId || !keyId || !authKey) return null;
  return { teamId, keyId, authKey: authKey.replace(/\\n/g, '\n'), bundleId, host };
}

let cachedJwt: { token: string; issuedAt: number; keyId: string } | null = null;

function signApnsJwt(cfg: ApnsConfig): string {
  // 50분 이내면 재사용 (Apple 권장: 1시간마다 갱신)
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.keyId === cfg.keyId && now - cachedJwt.issuedAt < 3000) {
    return cachedJwt.token;
  }

  const header = { alg: 'ES256', kid: cfg.keyId, typ: 'JWT' };
  const payload = { iss: cfg.teamId, iat: now };

  const enc = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const signingInput = `${enc(header)}.${enc(payload)}`;

  const key = createPrivateKey({ key: cfg.authKey, format: 'pem' });
  const sig = createSign('SHA256').update(signingInput).sign({ key, dsaEncoding: 'ieee-p1363' });
  const sigB64 = sig.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const token = `${signingInput}.${sigB64}`;
  cachedJwt = { token, issuedAt: now, keyId: cfg.keyId };
  return token;
}

export interface PushPayload {
  title: string;
  body?: string;
  /** 클릭 시 열 path (예: "/driver/trip/abc"). NativeAppBridge가 라우팅. */
  link?: string;
  /** 추가 데이터 — 클라에서 분기 */
  data?: Record<string, string | number | boolean | null>;
  /** APNs `apns-collapse-id` (동일 ID는 묶음 표시) */
  collapseId?: string;
  /** 알림 우선순위 — 기본 10 (즉시) */
  priority?: 5 | 10;
}

interface SendResult {
  ok: boolean;
  status: number;
  reason?: string;
}

async function sendOne(cfg: ApnsConfig, token: string, payload: PushPayload): Promise<SendResult> {
  const aps = {
    alert: {
      title: payload.title,
      body: payload.body ?? '',
    },
    sound: 'default',
    badge: 1,
    'mutable-content': 1,
  };
  const body = JSON.stringify({
    aps,
    link: payload.link ?? null,
    ...(payload.data ?? {}),
  });

  const headers: Record<string, string> = {
    'authorization': `bearer ${signApnsJwt(cfg)}`,
    'apns-topic': cfg.bundleId,
    'apns-push-type': 'alert',
    'apns-priority': String(payload.priority ?? 10),
    'content-type': 'application/json',
  };
  if (payload.collapseId) headers['apns-collapse-id'] = payload.collapseId;

  try {
    const res = await fetch(`${cfg.host}/3/device/${token}`, {
      method: 'POST',
      headers,
      body,
    });
    if (res.ok) return { ok: true, status: res.status };
    let reason: string | undefined;
    try {
      const j = (await res.json()) as { reason?: string };
      reason = j.reason;
    } catch {
      // ignore
    }
    return { ok: false, status: res.status, reason };
  } catch (e) {
    return { ok: false, status: 0, reason: e instanceof Error ? e.message : 'network' };
  }
}

/**
 * 한 사용자의 모든 활성 토큰으로 푸시 발송. 실패 토큰은 자동 revoke.
 * 환경변수 미설정 시 noop (개발 환경 영향 없음).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const cfg = readConfig();
  if (!cfg) return; // APNs 미설정 — silently skip

  const tokens = await prisma.deviceToken.findMany({
    where: { userId, revokedAt: null, platform: 'IOS' },
    select: { id: true, token: true },
  });
  if (tokens.length === 0) return;

  await Promise.all(
    tokens.map(async (t) => {
      const r = await sendOne(cfg, t.token, payload);
      if (r.ok) {
        await prisma.deviceToken
          .update({
            where: { id: t.id },
            data: { lastSeenAt: new Date(), lastError: null },
          })
          .catch(() => undefined);
        return;
      }
      // 영구 실패 — 토큰 폐기
      const permanent =
        r.status === 410 ||
        r.reason === 'BadDeviceToken' ||
        r.reason === 'Unregistered' ||
        r.reason === 'DeviceTokenNotForTopic';
      if (permanent) {
        await prisma.deviceToken
          .update({
            where: { id: t.id },
            data: { revokedAt: new Date(), lastError: r.reason ?? `HTTP ${r.status}` },
          })
          .catch(() => undefined);
      } else {
        await prisma.deviceToken
          .update({
            where: { id: t.id },
            data: { lastError: r.reason ?? `HTTP ${r.status}` },
          })
          .catch(() => undefined);
      }
    }),
  );
}
