/**
 * 차주 네이티브 앱에서 driver API를 호출할 때 platform marker 헤더를 자동 첨부하는 fetch wrapper.
 *
 * - 웹(브라우저)에서는 표준 fetch와 동일하게 동작
 * - Capacitor 네이티브에서는 `X-PortLink-Native: ios|android` 헤더 자동 첨부
 *   서버는 §14 spoofing 가드 시 가중치 부여 가능 (앱 무결성 검증 1차 신호)
 *
 * NOTE: 헤더가 있다는 것만으로 신뢰 X — 어디까지나 보조 신호.
 *       강한 무결성은 추후 App Attest / SafetyNet 단계에서.
 */
import { getNativePlatform } from './geolocation';

export async function nativeFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const platform = getNativePlatform();
  if (!platform) return fetch(input, init);

  const headers = new Headers(init.headers);
  headers.set('X-PortLink-Native', platform);
  return fetch(input, { ...init, headers });
}
