'use client';

import { ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import type { PointerEvent } from 'react';
import { getRecommendationKind } from '@/lib/recommendation-filter';
import type { RecommendedShare } from '@/lib/recommended-shares';

export function RecommendationCard({ resource }: { resource: RecommendedShare }) {
  const reduced = useReducedMotion();
  function spotlight(event: PointerEvent<HTMLAnchorElement>) {
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }
  return <a className="resource-card" href={resource.url} target="_blank" rel="noopener noreferrer" onPointerMove={spotlight}>
    <span className="resource-card__top">
      <span className="resource-card__logo">{resource.avatarSrc ? <img src={resource.avatarSrc} alt="" width="44" height="44" loading="lazy" /> : resource.logo}</span>
      <span className="resource-card__kind">{getRecommendationKind(resource) === 'website' ? '网站' : '开源项目'}</span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </span>
    <strong>{resource.name}</strong>
    <span className="resource-card__description">{resource.description}</span>
    <span className="resource-card__tags">{resource.tags.filter(tag => tag !== '开源项目').map(tag => <span key={tag}>{tag}</span>)}</span>
    <span className="resource-card__rating">推荐等级 {resource.stars}/5{resource.githubStars != null && <span>GitHub ★ {Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(resource.githubStars)}（缓存）</span>}</span>
    <span className="sr-only">（在新标签页打开）</span>
  </a>;
}
