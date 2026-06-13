'use client';

import { useState } from 'react';

import { buildLoginRequest } from '@/lib/auth-client';

type LoginState = 'idle' | 'submitting' | 'success' | 'error';

export function LoginForm({ redirectTo = '/admin' }: { redirectTo?: string }) {
  const [state, setState] = useState<LoginState>('idle');
  const [message, setMessage] = useState('');
  const loginBusy = state === 'submitting';

  async function handleSubmit(formData: FormData) {
    setState('submitting');
    setMessage('');

    const request = buildLoginRequest({
      account: String(formData.get('account') ?? ''),
      password: String(formData.get('password') ?? ''),
    });

    try {
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error('登录失败');
      }

      setState('success');
      setMessage('登录成功，可以进入后台管理。');
      window.location.assign(redirectTo);
    } catch {
      setState('error');
      setMessage('账号或密码不正确，或 API 服务暂不可用。');
    }
  }

  return (
    <form className="login-panel" action={handleSubmit} aria-busy={loginBusy}>
      <div className="login-panel__brand">
        <span className="login-panel__mark" aria-hidden="true">
          SS
        </span>
        <div>
          <p className="eyebrow">安全入口</p>
          <h1>内容系统后台</h1>
          <p>登录后可管理文章、项目、留言、素材与站点配置。</p>
        </div>
      </div>
      <div className="login-panel__fields">
        <label>
          <span>账号</span>
          <input name="account" type="text" placeholder="owner@example.com" autoComplete="username" required />
        </label>
        <label>
          <span>密码</span>
          <input name="password" type="password" placeholder="请输入后台密码" autoComplete="current-password" required />
        </label>
      </div>
      <div className="login-panel__actions">
        <button type="submit" disabled={loginBusy} aria-disabled={loginBusy}>
          {state === 'submitting' ? '登录中' : '进入后台'}
        </button>
        <span>仅站长可用，会话将以安全 Cookie 保存。</span>
      </div>
      {message ? <p className={`form-message form-message--${state}`} role="status" aria-live="polite">{message}</p> : null}
    </form>
  );
}
