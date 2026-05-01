import { Suspense } from 'react';
import LoginPageClient from './login-client';

export const metadata = { title: '로그인' };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
