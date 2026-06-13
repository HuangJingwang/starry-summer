import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('admin cover picker', () => {
  test('lets authors choose uploaded cover assets for content covers', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentForm.tsx'), 'utf8');
    const panelSource = readFileSync(join(process.cwd(), 'src/components/AdminPublishSettingsPanel.tsx'), 'utf8');

    expect(source).toContain("const authoringAssetUsages: AssetUsage[] = ['content', 'attachment', 'cover'];");
    expect(panelSource).toContain('className="cover-picker"');
    expect(panelSource).toContain('从封面素材选择');
    expect(source).toContain('applySelectedCoverAsset');
    expect(source).toContain('setCoverAssetId(selectedCover.id)');
    expect(panelSource).toContain('设为封面');
  });
});
