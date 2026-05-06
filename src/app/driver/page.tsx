import { redirect } from 'next/navigation';

// /driver 진입 시 /driver/jobs로 즉시 리다이렉트.
// Capacitor server.url=.../driver 또는 /login?next=/driver 후속 진입 케이스 모두 커버.
export default function DriverIndex(): never {
  redirect('/driver/jobs');
}
