import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('LoginForm', () => {
  test('shows a static-mode notice instead of credential fields', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/LoginForm.tsx'), 'utf8');

    expect(source).toContain('静态站模式');
    expect(source).toContain('通过 git 提交更新');
    expect(source).not.toContain("formData.get('account')");
    expect(source).not.toContain('type="password"');
    expect(source).not.toContain('/api/auth/login');
  });

  test('keeps the panel accessible without submitting state', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/LoginForm.tsx'), 'utf8');

    expect(source).toContain('login-panel__brand');
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).not.toContain('submitting');
  });
});
