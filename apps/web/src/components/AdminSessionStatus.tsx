'use client';

import { useEffect, useState } from 'react';

import { buildLogoutRequest, buildSessionRequest } from '@/lib/auth-client';

interface AdminSession {
  email: string;
  expiresAt: string;
}

export function AdminSessionStatus() {
  const [session, setSession] = useState<AdminSession | null>(null);

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
      });

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    const request = buildLogoutRequest();

    await fetch(request.url, request.init).catch(() => undefined);
    setSession(null);
    window.location.replace('/admin/login');
  }

  return (
    <div className="admin-session">
      <span>{session?.email ?? '后台会话'}</span>
      <button type="button" onClick={logout}>
        退出登录
      </button>
    </div>
  );
}
