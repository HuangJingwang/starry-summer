'use client';

import { useState } from 'react';

import { buildGuestbookRequest, PUBLIC_SUBMISSION_LIMITS } from '@/lib/interaction-client';

export function GuestbookForm() {
  const [message, setMessage] = useState('');

  async function submit(formData: FormData) {
    const request = buildGuestbookRequest({
      authorName: String(formData.get('authorName') ?? ''),
      body: String(formData.get('body') ?? ''),
    });

    try {
      const response = await fetch(request.url, request.init);
      setMessage(response.ok ? '留言已提交，审核通过后会显示在这里。' : '提交失败，请稍后再试。');
    } catch {
      setMessage('API 暂不可用，稍后再试。');
    }
  }

  return (
    <form className="guestbook-form" action={submit}>
      <input name="authorName" aria-label="Name" placeholder="你的名字" maxLength={PUBLIC_SUBMISSION_LIMITS.authorName} required />
      <textarea name="body" aria-label="Message" placeholder="留下些什么" rows={5} maxLength={PUBLIC_SUBMISSION_LIMITS.body} required />
      <button type="submit">提交留言</button>
      {message ? <p>{message}</p> : null}
    </form>
  );
}
