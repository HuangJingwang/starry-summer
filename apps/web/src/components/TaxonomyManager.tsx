'use client';

import { useEffect, useState } from 'react';

import {
  buildCreateTaxonomyTermRequest,
  buildDeleteTaxonomyTermRequest,
  buildListTaxonomyTermsRequest,
  buildTaxonomyPayloadFromFormData,
  normalizeTaxonomyTerm,
  type TaxonomyTerm,
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

type PanelState = 'idle' | 'loading' | 'submitting' | 'success' | 'error';

function TaxonomyPanel({ type }: { type: TaxonomyType }) {
  const [state, setState] = useState<PanelState>('idle');
  const [message, setMessage] = useState('');
  const [terms, setTerms] = useState<TaxonomyTerm[]>([]);
  const copy = taxonomyCopy[type];

  async function send(request: { url: string; init: RequestInit }) {
    const response = await fetch(request.url, request.init);

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return response.json().catch(() => null);
  }

  async function loadTerms() {
    setState((current) => (current === 'submitting' ? current : 'loading'));

    try {
      const data = await send(buildListTaxonomyTermsRequest(type));
      const nextTerms = Array.isArray(data) ? data.map((item) => normalizeTaxonomyTerm(item)) : [];
      setTerms(nextTerms);
      setState('idle');
    } catch {
      setState('error');
      setMessage('读取列表失败，请确认 API 服务可用。');
    }
  }

  useEffect(() => {
    void loadTerms();
  }, [type]);

  async function create(formData: FormData) {
    setState('submitting');
    setMessage('');

    const request = buildCreateTaxonomyTermRequest(type, buildTaxonomyPayloadFromFormData(formData));

    try {
      await send(request);
      await loadTerms();

      setState('success');
      setMessage('已保存。');
    } catch {
      setState('error');
      setMessage('保存失败，请确认已登录且 API 服务可用。');
    }
  }

  async function deleteTerm(id: string) {
    setState('submitting');
    setMessage('');

    try {
      await send(buildDeleteTaxonomyTermRequest(type, id));
      await loadTerms();
      setState('success');
      setMessage('已删除。');
    } catch {
      setState('error');
      setMessage('删除失败，请确认已登录且 API 服务可用。');
    }
  }

  return (
    <section>
      <h2>{copy.title}</h2>
      <div className="taxonomy-list" aria-label={`${copy.title} list`}>
        {state === 'loading' ? <p>Loading...</p> : null}
        {terms.length === 0 && state !== 'loading' ? <p className="empty-state">暂无条目</p> : null}
        {terms.map((term) => (
          <article key={term.id} className="taxonomy-term">
            <div>
              <strong>{term.name}</strong>
              <span>{term.slug}</span>
            </div>
            <button type="button" onClick={() => deleteTerm(term.id)} disabled={state === 'submitting'}>
              Delete
            </button>
          </article>
        ))}
      </div>
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
