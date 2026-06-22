'use client';

import { useMemo, useState } from 'react';

import type { RecommendedShare } from '@/lib/recommended-shares';
import { categoryOrder } from '@/lib/recommended-shares';

export function RecommendedShareGrid({ resources }: { resources: RecommendedShare[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('全部');
  const availableTags = useMemo(() => {
    const resourceTags = new Set(resources.flatMap((resource) => resource.tags));

    return categoryOrder.filter((tag) => tag === '全部' || resourceTags.has(tag));
  }, [resources]);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      !normalizedSearch ||
      [resource.name, resource.url, resource.description, ...resource.tags].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    const matchesTag = selectedTag === '全部' || resource.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <section className="share-page__panel" aria-label="推荐资源">
      <div className="share-page__filters">
        <label className="share-page__search">
          <span>搜索资源</span>
          <input
            type="search"
            value={searchTerm}
            placeholder="搜索资源..."
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
        </label>
        <div className="share-page__tag-list" aria-label="资源分类">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={selectedTag === tag}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="share-page__grid">
        {filteredResources.map((resource) => (
          <a key={resource.url} className="share-page__card" href={resource.url} target="_blank" rel="noreferrer">
            <span className="share-page__logo" aria-hidden="true">
              {resource.logo}
            </span>
            <span className="share-page__body">
              <strong>{resource.name}</strong>
              <small>{resource.url}</small>
              <span className="share-page__stars" aria-label={`${resource.stars} 星推荐`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} data-filled={index < resource.stars ? 'true' : undefined}>
                    ★
                  </span>
                ))}
              </span>
              <span className="share-page__tags">
                {resource.tags.map((tag) => (
                  <em key={tag}>{tag}</em>
                ))}
              </span>
              <span className="share-page__description">{resource.description}</span>
            </span>
          </a>
        ))}
      </div>

      {filteredResources.length === 0 ? <p className="share-page__empty">没有找到相关资源</p> : null}
    </section>
  );
}
