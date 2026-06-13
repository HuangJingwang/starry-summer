import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('LoginForm', () => {
  test('uses a generic account field for admin login', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/LoginForm.tsx'), 'utf8');

    expect(source).toContain("formData.get('account')");
    expect(source).toContain('账号');
    expect(source).toContain('placeholder="owner@example.com"');
    expect(source).toContain('type="text"');
    expect(source).not.toContain('type="email"');
    expect(source).not.toContain('邮箱或密码不正确');
  });

  test('exposes submitting state on the login form and button', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/LoginForm.tsx'), 'utf8');

    expect(source).toContain("const loginBusy = state === 'submitting';");
    expect(source).toContain('aria-busy={loginBusy}');
    expect(source).toContain('disabled={loginBusy}');
    expect(source).toContain('aria-disabled={loginBusy}');
  });
});
