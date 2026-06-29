'use client';

import { useState } from 'react';

import {
  buildSettingsFormKey,
  formatHeroQuotesText,
  formatSocialLinksText,
  normalizeSiteSettings,
  parseHeroQuotesText,
  parseSocialLinksText,
  type SiteSettings,
} from '@/lib/settings';

type SaveState = 'idle' | 'loading' | 'submitting' | 'success' | 'error';

const fallbackSettings = normalizeSiteSettings({});
const STATIC_SETTINGS_WRITE_MESSAGE =
  '静态站模式下不会在线保存设置。请修改 apps/web/content/site-settings.json，提交 git commit 并推送触发部署。';
const navigationOptions = [
  { key: 'search', label: '搜索', description: '顶部搜索框和搜索页入口' },
  { key: 'posts', label: '文章', description: '长文和笔记的统一阅读入口' },
  { key: 'moments', label: '推荐分享', description: '工具、灵感网站和学习资源入口' },
  { key: 'projects', label: '项目', description: '项目档案和作品展示' },
  { key: 'categories', label: '分类', description: '按主题组织内容' },
  { key: 'tags', label: '标签', description: '自由标签索引' },
  { key: 'archives', label: '归档', description: '按时间回看内容' },
];

export function SettingsManager({ initialSettings = fallbackSettings }: { initialSettings?: SiteSettings }) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const settingsBusy = state === 'loading' || state === 'submitting';

  async function save(formData: FormData) {
    setState('submitting');
    setMessage('');

    const input = {
      profile: {
        title: String(formData.get('title') ?? ''),
        ownerName: String(formData.get('ownerName') ?? ''),
        description: String(formData.get('description') ?? ''),
        socialLinks: parseSocialLinksText(String(formData.get('socialLinks') ?? '')),
      },
      hero: {
        tagline: String(formData.get('tagline') ?? ''),
        backgroundImageUrl: String(formData.get('backgroundImageUrl') ?? ''),
        motto: String(formData.get('motto') ?? ''),
        quotes: parseHeroQuotesText(String(formData.get('quotes') ?? '')),
      },
      navigation: formData.getAll('navigation').map(String),
    };
    setSettings(normalizeSiteSettings(input));
    setState('error');
    setMessage(STATIC_SETTINGS_WRITE_MESSAGE);
  }

  return (
    <form className="content-form settings-form" action={save} key={buildSettingsFormKey(settings)} aria-busy={settingsBusy}>
      <section className="settings-section settings-section--primary">
        <div className="settings-section__header">
          <span>Profile</span>
          <h2>公开身份</h2>
          <p>控制公开页面的站点名称、站主名称、SEO 描述和社交入口。</p>
        </div>
        <div className="form-grid">
          <label>
            站点标题
            <input name="title" defaultValue={settings.profile.title} />
          </label>
          <label>
            作者名称
            <input name="ownerName" defaultValue={settings.profile.ownerName} />
          </label>
        </div>
        <div className="settings-safety-note">
          <strong>公开身份提示</strong>
          <p>公开显示名建议保持为 Aster.H，个人真实姓名、私人账号和内部身份不要写入公开资料或 SEO 描述。</p>
        </div>
        <label>
          SEO 描述
          <textarea name="description" rows={4} defaultValue={settings.profile.description} />
        </label>
        <label>
          社交链接
          <textarea
            name="socialLinks"
            rows={4}
            defaultValue={formatSocialLinksText(settings.profile.socialLinks)}
            placeholder="平台名称 | 链接地址"
          />
        </label>
      </section>
      <section className="settings-section">
        <div className="settings-section__header">
          <span>Home</span>
          <h2>首页</h2>
          <p>管理首页短句、箴言和备用背景，影响前台首页第一屏观感。首页模块排序和开关会在外观维护中逐步收拢。</p>
        </div>
        <label>
          首页短句
          <input name="tagline" defaultValue={settings.hero.tagline} />
        </label>
        <label>
          首页箴言
          <input name="motto" defaultValue={settings.hero.motto} />
        </label>
        <label>
          箴言列表
          <textarea
            name="quotes"
            rows={5}
            defaultValue={formatHeroQuotesText(settings.hero.quotes)}
            placeholder="每行一句，会在首页随机展示"
          />
        </label>
        <label>
          备用首页背景
          <input name="backgroundImageUrl" defaultValue={settings.hero.backgroundImageUrl} placeholder="/images/your-summer-background.jpg" />
        </label>
      </section>
      <section className="settings-section settings-section--compact">
        <div className="settings-section__header">
          <span>Appearance</span>
          <h2>外观</h2>
          <p>只保留主题、首页模块和背景图这类高价值控制。不开放细粒度文章排版，正文宽度、字号、行高和代码块样式继续由公共主题统一保证。</p>
        </div>
        <div className="settings-maintenance-grid" aria-label="外观维护">
          <span>
            <strong>公开主题</strong>
            <small>保留夏日白昼和赛博夜档案两套公开主题。</small>
          </span>
          <span>
            <strong>首页模块</strong>
            <small>后续支持模块开关、顺序和默认布局重置。</small>
          </span>
          <span>
            <strong>背景图片</strong>
            <small>当前可通过备用首页背景字段维护。</small>
          </span>
        </div>
      </section>
      <section className="settings-section settings-section--compact">
        <div className="settings-section__header">
          <span>Navigation</span>
          <h2>导航</h2>
          <p>勾选公开导航入口，保存后影响前台顶部导航。搜索入口会保留顶部搜索框，其他入口按下方顺序展示。</p>
        </div>
        <div className="settings-navigation-grid" aria-label="公开导航入口">
          {navigationOptions.map((option) => (
            <label key={option.key}>
              <input
                name="navigation"
                type="checkbox"
                value={option.key}
                defaultChecked={settings.navigation.includes(option.key)}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>
      </section>
      <section className="settings-section settings-section--compact">
        <div className="settings-section__header">
          <span>Maintenance</span>
          <h2>维护</h2>
          <p>素材、分类索引、导入导出和仓库保存说明属于低频维护，不进入默认写作路径。</p>
        </div>
        <p className="settings-safety-note">静态站模式下，设置保存会提示修改仓库文件并提交部署。</p>
      </section>
      <button type="submit" disabled={settingsBusy} aria-disabled={settingsBusy}>
        {state === 'submitting' ? '保存中' : '保存设置'}
      </button>
      {message ? <p className={`form-message form-message--${state}`} role="status" aria-live="polite">{message}</p> : null}
    </form>
  );
}
