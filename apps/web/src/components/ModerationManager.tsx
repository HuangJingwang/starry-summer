'use client';

import { useEffect, useState } from 'react';
import type { ModerationStatus } from '@starry-summer/shared';

import {
  buildAdminModerationListRequest,
  buildModerationActionRequest,
  buildModerationDeleteRequest,
  normalizeModerationRecord,
  type ModerationRecord,
  type ModerationResource,
} from '@/lib/interaction-client';

interface ModerationManagerProps {
  resource: ModerationResource;
  emptyText: string;
}

type LoadState = 'idle' | 'loading' | 'submitting' | 'error';

const statusOptions: Array<{ label: string; value: ModerationStatus | '' }> = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Spam', value: 'spam' },
  { label: 'All', value: '' },
];

const actionOptions: Array<{ label: string; value: ModerationStatus }> = [
  { label: 'Approve', value: 'approved' },
  { label: 'Reject', value: 'rejected' },
  { label: 'Spam', value: 'spam' },
];

async function send(request: { url: string; init: RequestInit }) {
  const response = await fetch(request.url, request.init);

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json().catch(() => null);
}

export function ModerationManager({ resource, emptyText }: ModerationManagerProps) {
  const [status, setStatus] = useState<ModerationStatus | ''>('pending');
  const [records, setRecords] = useState<ModerationRecord[]>([]);
  const [state, setState] = useState<LoadState>('idle');
  const [message, setMessage] = useState('');

  async function load(nextStatus: ModerationStatus | '' = status) {
    setState('loading');
    setMessage('');

    try {
      const data = await send(buildAdminModerationListRequest(resource, nextStatus || undefined));
      setRecords(Array.isArray(data) ? data.map((item) => normalizeModerationRecord(item)) : []);
      setState('idle');
    } catch {
      setState('error');
      setMessage('读取失败，请确认已登录且 API 服务可用。');
    }
  }

  useEffect(() => {
    void load(status);
  }, [resource, status]);

  async function moderate(id: string, nextStatus: ModerationStatus) {
    setState('submitting');
    setMessage('');

    try {
      await send(buildModerationActionRequest(resource, id, nextStatus));
      await load(status);
    } catch {
      setState('error');
      setMessage('审核操作失败，请确认已登录且 API 服务可用。');
    }
  }

  async function deleteRecord(id: string) {
    if (!window.confirm('Permanently delete this submission?')) {
      return;
    }

    setState('submitting');
    setMessage('');

    try {
      await send(buildModerationDeleteRequest(resource, id));
      await load(status);
    } catch {
      setState('error');
      setMessage('删除失败，请确认已登录且 API 服务可用。');
    }
  }

  return (
    <div className="moderation-manager">
      <div className="moderation-toolbar" role="tablist" aria-label="Moderation status">
        {statusOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            className={status === option.value ? 'active' : ''}
            onClick={() => setStatus(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {message ? <p className={`form-message form-message--${state}`}>{message}</p> : null}
      <div className="moderation-list">
        {state === 'loading' ? <p className="empty-state">Loading...</p> : null}
        {records.length === 0 && state !== 'loading' ? <p className="empty-state">{emptyText}</p> : null}
        {records.map((record) => (
          <article key={record.id}>
            <span>{record.status}</span>
            <strong>{record.authorName}</strong>
            <p>{record.body}</p>
            <small>
              {record.targetType && record.targetId ? `${record.targetType}:${record.targetId} · ` : ''}
              {record.createdAt.slice(0, 10)}
            </small>
            {record.ipHash || record.userAgent ? (
              <small className="moderation-source">
                {record.ipHash ? `source ${record.ipHash.slice(0, 12)}` : 'source unknown'}
                {record.userAgent ? ` · ${record.userAgent}` : ''}
              </small>
            ) : null}
            <div className="admin-actions">
              {actionOptions.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  disabled={state === 'submitting' || record.status === action.value}
                  onClick={() => moderate(record.id, action.value)}
                >
                  {action.label}
                </button>
              ))}
              <button type="button" disabled={state === 'submitting'} onClick={() => deleteRecord(record.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
