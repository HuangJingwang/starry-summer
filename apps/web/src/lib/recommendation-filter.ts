import type { RecommendedShare } from './recommended-shares';

export type RecommendationKind = 'all' | 'website' | 'opensource';
export function getRecommendationKind(resource: RecommendedShare): Exclude<RecommendationKind, 'all'> {
  return resource.tags.includes('开源项目') ? 'opensource' : 'website';
}
export function filterRecommendations(resources: RecommendedShare[], query: string, tag: string, kind: RecommendationKind) {
  const search = query.trim().toLocaleLowerCase();
  return resources.filter(resource =>
    (kind === 'all' || getRecommendationKind(resource) === kind) &&
    (tag === '全部' || resource.tags.includes(tag)) &&
    (!search || [resource.name, resource.description, resource.url, ...resource.tags].some(value => value.toLocaleLowerCase().includes(search))),
  );
}
