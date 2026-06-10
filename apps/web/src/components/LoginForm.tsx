'use client';

import { useState } from 'react';

import { buildLoginRequest } from '@/lib/auth-client';

type LoginState = 'idle' | 'submitting' | 'success' | 'error';

export function LoginForm() {
  const [state, setState] = useState<LoginState>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(formData: FormData) {
    setState('submitting');
    setMessage('');

    const request = buildLoginRequest({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });

    try {
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error('登录失败');
      }

      setState('success');
      setMessage('登录成功，可以进入后台管理。');
    } catch {
      setState('error');
      setMessage('邮箱或密码不正确，或 API 服务暂不可用。');
    }
  }

  return (
    <form className="login-panel" action={handleSubmit}>
      <p className="eyebrow">Owner only</p>
      <h1>登录</h1>
      <label>
        邮箱
        <input name="email" type="email" placeholder="owner@example.com" autoComplete="username" required />
      </label>
      <label>
        密码
        <input name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
      </label>
      <button type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? '登录中' : '登录'}
      </button>
      {message ? <p className={`form-message form-message--${state}`}>{message}</p> : null}
    </form>
  );
}
