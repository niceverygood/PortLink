import { Suspense } from 'react';
import LoginPageClient from './login-client';

export const metadata = { title: '로그인' };

export default function LoginPage() {
  // SEED_PASSWORD가 설정된 환경에서만 테스트 로그인 노출 (시연 전용).
  const testLoginEnabled = !!process.env.SEED_PASSWORD;

  return (
    <Suspense fallback={null}>
      <LoginPageClient testLoginEnabled={testLoginEnabled} />
    </Suspense>
  );
}
