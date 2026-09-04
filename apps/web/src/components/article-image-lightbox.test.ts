import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('ArticleImageLightbox integration', () => {
  test('upgrades reader images into an accessible fullscreen preview', () => {
    const componentPath = join(process.cwd(), 'src/components/ArticleImageLightbox.tsx');
    const detailSource = readFileSync(join(process.cwd(), 'src/components/ContentDetail.tsx'), 'utf8');

    expect(existsSync(componentPath)).toBe(true);

    const componentSource = readFileSync(componentPath, 'utf8');
    expect(componentSource).toContain("'use client';");
    expect(componentSource).toContain("'.detail__body img'");
    expect(componentSource).toContain("setAttribute('role', 'button')");
    expect(componentSource).toContain("setAttribute('tabindex', '0')");
    expect(componentSource).toContain("event.key === 'Enter'");
    expect(componentSource).toContain("event.key === ' '");
    expect(componentSource).toContain("event.key === 'Escape'");
    expect(componentSource).toContain('closeButtonRef.current?.focus({ preventScroll: true })');
    expect(componentSource).toContain('triggerRef.current?.focus({ preventScroll: true })');
    expect(componentSource).toContain('role="dialog"');
    expect(componentSource).toContain('aria-modal="true"');
    expect(componentSource).toContain('article-image-lightbox');
    expect(detailSource).toContain("import { ArticleImageLightbox } from './ArticleImageLightbox';");
    expect(detailSource).toContain('<ArticleImageLightbox />');
  });
});
