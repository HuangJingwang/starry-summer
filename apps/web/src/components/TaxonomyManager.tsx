'use client';

import { useEffect, useState } from 'react';

import {
  buildCreateTaxonomyTermRequest,
  buildDeleteTaxonomyTermRequest,
  buildListTaxonomyTermsRequest,
  buildTaxonomyPayloadFromFormData,
  normalizeTaxonomyTerm,
  readTaxonomyErrorMessage,
  type TaxonomyTerm,
  type TaxonomyType,
} from '@/lib/taxonomy';

const taxonomyCopy: Record<TaxonomyType, { title: string; placeholder: string }> = {
  category: {
    title: '分类',
    placeholder: '长文写作',
  },
  tag: {
    title: '标签',
    placeholder: 'Markdown',
  },
  series: {
    title: '系列',
    placeholder: '平台笔记',
  },
};

type PanelState = 'idle' | 'loading' | 'submitting' | 'success' | 'error';

function TaxonomyPanel({ type }: { type: TaxonomyType }) {
  const [state, setState] = useState<PanelState>('idle');
  const [message, setMessage] = useState('');
  const [terms, setTerms] = useState<TaxonomyTerm[]>([]);
  const copy = taxonomyCopy[type];
  const taxonomyBusy = state === 'submitting';

  async function send(request: { url: string; init: RequestInit }, fallback: string) {
    const response = await fetch(request.url, request.init);

    if (!response.ok) {
      throw new Error(await readTaxonomyErrorMessage(response, fallback));
    }

    return response.json().catch(() => null);
  }

  async function loadTerms() {
    setState((current) => (current === 'submitting' ? current : 'loading'));

    try {
      const data = await send(buildListTaxonomyTermsRequest(type), '读取列表失败，请确认 API 服务可用。');
      const nextTerms = Array.isArray(data) ? data.map((item) => normalizeTaxonomyTerm(item)) : [];
      setTerms(nextTerms);
      setState('idle');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '读取列表失败，请确认 API 服务可用。');
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
      await send(request, '保存失败，请确认已登录且 API 服务可用。');
      await loadTerms();

      setState('success');
      setMessage('已保存。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '保存失败，请确认已登录且 API 服务可用。');
    }
  }

  async function deleteTerm(id: string) {
    setState('submitting');
    setMessage('');

    try {
      await send(buildDeleteTaxonomyTermRequest(type, id), '删除失败，请确认已登录且 API 服务可用。');
      await loadTerms();
      setState('success');
      setMessage('已删除。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '删除失败，请确认已登录且 API 服务可用。');
    }
  }

  return (
    <section className="taxonomy-panel">
      <div className="taxonomy-panel__header">
        <div>
          <span>术语管理</span>
          <h2>{copy.title}</h2>
        </div>
        <strong>{terms.length}</strong>
      </div>
      <div className="taxonomy-list" aria-label={`${copy.title}列表`}>
        {state === 'loading' ? <p className="empty-state">加载中...</p> : null}
        {terms.length === 0 && state !== 'loading' ? <p className="empty-state">暂无条目</p> : null}
        {terms.map((term) => (
          <article key={term.id} className="taxonomy-term">
            <div>
              <strong>{term.name}</strong>
              <span>{term.parentId ? `${term.slug} / 父级 ${parentLabel(terms, term.parentId)}` : term.slug}</span>
            </div>
            <button type="button" onClick={() => deleteTerm(term.id)} disabled={taxonomyBusy} aria-disabled={taxonomyBusy}>
              删除
            </button>
          </article>
        ))}
      </div>
      <form className="taxonomy-form" action={create} aria-busy={taxonomyBusy}>
        <label>
          名称
          <input name="name" placeholder={copy.placeholder} required />
        </label>
        <label>
          Slug
          <input name="slug" placeholder="自动生成，可手动填写" />
        </label>
        <label>
          描述
          <textarea name="description" rows={3} placeholder="这个分类条目的补充说明" />
        </label>
        {type === 'category' ? (
          <label>
            父级分类
            <select name="parentId" defaultValue="">
              <option value="">无</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          排序
          <input name="sortOrder" type="number" defaultValue={0} />
        </label>
        <button type="submit" disabled={taxonomyBusy} aria-disabled={taxonomyBusy}>
          {taxonomyBusy ? '保存中' : '保存'}
        </button>
        {message ? <p className={`form-message form-message--${state}`} role="status" aria-live="polite">{message}</p> : null}
      </form>
    </section>
  );
}

function parentLabel(terms: TaxonomyTerm[], parentId: string): string {
  return terms.find((term) => term.id === parentId)?.name ?? parentId;
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
