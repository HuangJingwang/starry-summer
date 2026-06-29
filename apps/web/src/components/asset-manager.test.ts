import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('asset manager upload panel', () => {
  test('shows static asset workflow guidance instead of upload controls', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AssetManager.tsx'), 'utf8');

    expect(source).toContain('静态站模式');
    expect(source).toContain('apps/web/public/images');
    expect(source).toContain('git commit');
    expect(source).not.toContain('buildAssetUploadRequest');
    expect(source).not.toContain('type="file"');
  });

  test('keeps preview copy helpers for repository assets', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AssetManager.tsx'), 'utf8');

    expect(source).toContain('className="asset-thumb"');
    expect(source).toContain('asset.mimeType.startsWith');
    expect(source).toContain('copyAssetUrl');
    expect(source).toContain('copyAssetMarkdown');
    expect(source).toContain('buildMarkdownAssetEmbed');
    expect(source).toContain('复制 URL');
    expect(source).toContain('复制 Markdown');
  });

  test('does not call repository publishing APIs for assets', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AssetManager.tsx'), 'utf8');

    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('readAssetErrorMessage');
    expect(source).not.toContain('/api/repository/assets');
    expect(source).not.toContain('API 服务可用');
    expect(source).not.toContain('素材 Worker');
  });

  test('announces asset operation feedback accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AssetManager.tsx'), 'utf8');

    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('form-message form-message--${state}');
  });
});
