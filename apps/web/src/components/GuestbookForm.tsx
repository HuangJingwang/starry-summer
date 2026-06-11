'use client';

import { useState } from 'react';

import { buildGuestbookRequest, PUBLIC_SUBMISSION_LIMITS } from '@/lib/interaction-client';
import type { AuthenticatedReaderSession } from '@/lib/reader-auth';

export function GuestbookForm({ reader }: { reader: AuthenticatedReaderSession | null }) {
  const [message, setMessage] = useState('');

  if (!reader) {
    return (
      <div className="guestbook-login-gate">
        <p>为了避免匿名刷屏和垃圾留言，请先用 GitHub 登录。</p>
        <a href="/api/auth/github/login?next=/guestbook">GitHub 登录后留言</a>
      </div>
    );
  }

  async function submit(formData: FormData) {
    const request = buildGuestbookRequest({
      body: String(formData.get('body') ?? ''),
    });

    try {
      const response = await fetch(request.url, request.init);
      setMessage(response.ok ? '留言已提交，审核通过后会显示在这里。' : '请先用 GitHub 登录后再留言。');
    } catch {
      setMessage('API 暂不可用，稍后再试。');
    }
  }

  return (
    <form className="guestbook-form" action={submit}>
      <div className="guestbook-reader">
        <span>当前身份</span>
        <strong>{reader.displayName}</strong>
        <a href={reader.profileUrl} target="_blank" rel="noreferrer">
          @{reader.login}
        </a>
      </div>
      <textarea name="body" aria-label="Message" placeholder="留下些什么" rows={5} maxLength={PUBLIC_SUBMISSION_LIMITS.body} required />
      <button type="submit">提交留言</button>
      {message ? <p>{message}</p> : null}
    </form>
  );
}
