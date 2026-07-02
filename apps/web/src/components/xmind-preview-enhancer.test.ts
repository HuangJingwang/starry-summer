import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('XMindPreviewEnhancer integration', () => {
  test('lazily upgrades xmind links in public content detail pages', () => {
    const enhancerSource = readFileSync(join(process.cwd(), 'src/components/XMindPreviewEnhancer.tsx'), 'utf8');
    const detailSource = readFileSync(join(process.cwd(), 'src/components/ContentDetail.tsx'), 'utf8');

    expect(enhancerSource).toContain("'use client';");
    expect(enhancerSource).toContain('createPreviewFrame');
    expect(enhancerSource).toContain('/xmind-preview-frame.html');
    expect(enhancerSource).toContain('starry-xmind-preview:ready');
    expect(enhancerSource).toContain('starry-xmind-preview:error');
    expect(enhancerSource).toContain('IntersectionObserver');
    expect(enhancerSource).toContain('data-xmind-rendered');
    expect(enhancerSource).toContain('data-xmind-status');
    expect(enhancerSource).toContain('加载失败');
    expect(enhancerSource).toContain('下载原文件');
    expect(readFileSync(join(process.cwd(), 'public/xmind-preview-frame.html'), 'utf8')).toContain('XMindEmbedViewer');
    expect(detailSource).toContain("import { XMindPreviewEnhancer } from './XMindPreviewEnhancer';");
    expect(detailSource).toContain('<XMindPreviewEnhancer />');
  });
});
