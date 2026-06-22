import type { StudyCategoryProgress } from '@starry-summer/shared';

import { PublicContentSection } from '@/components/PublicPageLayout';

import { buildCategoryAnchor } from './leetcode-view-model';

export function StudyCategoryGrid({ categories }: { categories: StudyCategoryProgress[] }) {
  return (
    <PublicContentSection id="categories" eyebrow="题型分类" title="分类进度">
      <div className="study-category-grid">
        {categories.map((category) => {
          const anchor = buildCategoryAnchor(category.name);

          return (
            <a className="study-category-chip" href={`#${anchor}`} id={anchor} key={category.name}>
              <div>
                <strong>{category.name}</strong>
                <span>{category.rate}%</span>
              </div>
              <progress max={100} value={category.rate} aria-label={`${category.name}进度 ${category.rate}%`} />
              <small>
                {category.started}/{category.total} 已开始
              </small>
            </a>
          );
        })}
      </div>
    </PublicContentSection>
  );
}
