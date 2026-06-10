'use client';

import { useState } from 'react';

import {
  buildCreateTaxonomyTermRequest,
  buildTaxonomyPayloadFromFormData,
  type TaxonomyType,
} from '@/lib/taxonomy';

const taxonomyCopy: Record<TaxonomyType, { title: string; placeholder: string }> = {
  category: {
    title: 'Categories',
    placeholder: 'Long form writing',
  },
  tag: {
    title: 'Tags',
    placeholder: 'Markdown',
  },
  series: {
    title: 'Series',
    placeholder: 'Platform notes',
  },
};

type SaveState = 'idle' | 'submitting' | 'success' | 'error';

function TaxonomyPanel({ type }: { type: TaxonomyType }) {
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const copy = taxonomyCopy[type];

  async function create(formData: FormData) {
    setState('submitting');
    setMessage('');

    const request = buildCreateTaxonomyTermRequest(type, buildTaxonomyPayloadFromFormData(formData));

    try {
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      setState('success');
      setMessage('已保存。刷新后可从 API 列表读取。');
    } catch {
      setState('error');
      setMessage('保存失败，请确认已登录且 API 服务可用。');
    }
  }

  return (
    <section>
      <h2>{copy.title}</h2>
      <form className="taxonomy-form" action={create}>
        <label>
          Name
          <input name="name" placeholder={copy.placeholder} required />
        </label>
        <label>
          Slug
          <input name="slug" placeholder="leave blank to auto-generate" />
        </label>
        <label>
          Description
          <textarea name="description" rows={3} placeholder="Optional notes for this taxonomy term" />
        </label>
        <label>
          Sort
          <input name="sortOrder" type="number" defaultValue={0} />
        </label>
        <button type="submit" disabled={state === 'submitting'}>
          {state === 'submitting' ? 'Saving' : 'Save'}
        </button>
        {message ? <p className={`form-message form-message--${state}`}>{message}</p> : null}
      </form>
    </section>
  );
}

export function TaxonomyManager() {
  return (
    <div className="split-panels">
      <TaxonomyPanel type="category" />
      <TaxonomyPanel type="tag" />
      <TaxonomyPanel type="series" />
    </div>
  );
}
