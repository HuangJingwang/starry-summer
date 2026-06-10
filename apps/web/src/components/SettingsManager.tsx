'use client';

import { useEffect, useState } from 'react';

import {
  buildGetAdminSettingsRequest,
  buildUpdateSettingsRequest,
  normalizeSiteSettings,
  type SiteSettings,
} from '@/lib/settings';

type SaveState = 'idle' | 'loading' | 'submitting' | 'success' | 'error';

const fallbackSettings = normalizeSiteSettings({});

export function SettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);
  const [state, setState] = useState<SaveState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const request = buildGetAdminSettingsRequest();

    fetch(request.url, request.init)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Settings request failed with ${response.status}`);
        }

        return normalizeSiteSettings((await response.json()) as Partial<SiteSettings>);
      })
      .then((nextSettings) => {
        if (active) {
          setSettings(nextSettings);
          setState('idle');
        }
      })
      .catch(() => {
        if (active) {
          setState('error');
          setMessage('读取设置失败，请确认已登录且 API 服务可用。');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function save(formData: FormData) {
    setState('submitting');
    setMessage('');

    const request = buildUpdateSettingsRequest({
      profile: {
        title: String(formData.get('title') ?? ''),
        ownerName: String(formData.get('ownerName') ?? ''),
        description: String(formData.get('description') ?? ''),
      },
      hero: {
        tagline: String(formData.get('tagline') ?? ''),
        backgroundImageUrl: String(formData.get('backgroundImageUrl') ?? ''),
        motto: String(formData.get('motto') ?? ''),
      },
      navigation: String(formData.get('navigation') ?? '').split(','),
    });

    try {
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Settings update failed with ${response.status}`);
      }

      setSettings(normalizeSiteSettings((await response.json()) as Partial<SiteSettings>));
      setState('success');
      setMessage('设置已保存。');
    } catch {
      setState('error');
      setMessage('保存失败，请确认已登录且 API 服务可用。');
    }
  }

  return (
    <form className="content-form" action={save}>
      <div className="form-grid">
        <label>
          Site title
          <input name="title" defaultValue={settings.profile.title} />
        </label>
        <label>
          Owner
          <input name="ownerName" defaultValue={settings.profile.ownerName} />
        </label>
      </div>
      <label>
        SEO description
        <textarea name="description" rows={4} defaultValue={settings.profile.description} />
      </label>
      <label>
        首页短句
        <input name="tagline" defaultValue={settings.hero.tagline} />
      </label>
      <label>
        首页箴言
        <input name="motto" defaultValue={settings.hero.motto} />
      </label>
      <label>
        备用首页背景
        <input name="backgroundImageUrl" defaultValue={settings.hero.backgroundImageUrl} placeholder="/hero-workspace.png" />
      </label>
      <label>
        Navigation
        <input name="navigation" defaultValue={settings.navigation.join(', ')} />
      </label>
      <button type="submit" disabled={state === 'loading' || state === 'submitting'}>
        {state === 'submitting' ? 'Saving' : 'Save settings'}
      </button>
      {message ? <p className={`form-message form-message--${state}`}>{message}</p> : null}
    </form>
  );
}
