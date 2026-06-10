'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { buildLogoutRequest, buildSessionRequest } from '@/lib/auth-client';

interface AdminSession {
  email: string;
  expiresAt: string;
}

export function AdminSessionStatus() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const request = buildSessionRequest();

    fetch(request.url, request.init)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as AdminSession;
      })
      .then((nextSession) => {
        if (active) {
          setSession(nextSession);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    const request = buildLogoutRequest();

    await fetch(request.url, request.init).catch(() => undefined);
    setSession(null);
    window.location.assign('/admin/login');
  }

  if (loading) {
    return <div className="admin-session">Checking session</div>;
  }

  if (!session) {
    return (
      <div className="admin-session">
        <span>Not signed in</span>
        <Link href="/admin/login">Login</Link>
      </div>
    );
  }

  return (
    <div className="admin-session">
      <span>{session.email}</span>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}
