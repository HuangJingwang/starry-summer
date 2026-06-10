import { LoginForm } from '@/components/LoginForm';
import { getSafeAdminRedirectPath } from '@/lib/auth-client';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const redirectTo = getSafeAdminRedirectPath((await searchParams).next);

  return (
    <main className="admin-main">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
