import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('asset manager upload panel', () => {
  test('uses a styled file picker with selected file feedback', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AssetManager.tsx'), 'utf8');

    expect(source).toContain('selectedFileName');
    expect(source).toContain('asset-file-picker');
    expect(source).toContain('asset-upload-grid');
    expect(source).toContain('asset-upload-actions');
    expect(source).toContain('还没有选择文件');
  });

  test('loads the active gallery automatically and offers preview copy actions', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AssetManager.tsx'), 'utf8');

    expect(source).toContain('useEffect');
    expect(source).toContain('void loadAssets(usage');
    expect(source).toContain('className="asset-thumb"');
    expect(source).toContain('asset.mimeType.startsWith');
    expect(source).toContain('copyAssetUrl');
    expect(source).toContain('copyAssetMarkdown');
    expect(source).toContain('buildMarkdownAssetEmbed');
    expect(source).toContain('复制 URL');
    expect(source).toContain('复制 Markdown');
  });

  test('surfaces specific API errors when loading and deleting assets', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AssetManager.tsx'), 'utf8');

    expect(source).toContain('readAssetErrorMessage');
    expect(source).toContain("readAssetErrorMessage(response, '读取图库失败，请确认已登录且 API 服务可用。')");
    expect(source).toContain("readAssetErrorMessage(response, '删除失败，请确认已登录且 API 服务可用。')");
    expect(source).toContain('error instanceof Error ? error.message');
    expect(source).not.toContain('throw new Error(`Request failed with ${response.status}`)');
  });

  test('announces asset operation feedback accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AssetManager.tsx'), 'utf8');

    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('form-message form-message--${state}');
  });
});
