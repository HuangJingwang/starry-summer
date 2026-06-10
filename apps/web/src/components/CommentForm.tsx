'use client';

import { useState } from 'react';

import { buildCommentRequest, type CommentTargetType } from '@/lib/interaction-client';

export function CommentForm({ targetType, targetId }: { targetType: CommentTargetType; targetId: string }) {
  const [message, setMessage] = useState('');

  async function submit(formData: FormData) {
    const request = buildCommentRequest({
      targetType,
      targetId,
      authorName: String(formData.get('authorName') ?? ''),
      body: String(formData.get('body') ?? ''),
    });

    try {
      const response = await fetch(request.url, request.init);
      setMessage(response.ok ? '评论已提交，审核通过后会公开显示。' : '提交失败，请稍后再试。');
    } catch {
      setMessage('API 暂不可用，稍后再试。');
    }
  }

  return (
    <form className="interaction-form" action={submit}>
      <h2>评论</h2>
      <input name="authorName" placeholder="你的名字" required />
      <textarea name="body" placeholder="写下你的想法" rows={4} required />
      <button type="submit">提交评论</button>
      {message ? <p>{message}</p> : null}
    </form>
  );
}
