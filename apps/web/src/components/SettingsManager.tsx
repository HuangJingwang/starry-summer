'use client';

import Link from 'next/link';
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
      <div className="settings-page-header">
        <div>
          <p className="eyebrow">站点</p>
          <h2>站点设置</h2>
          <p>维护公开身份、首页展示、公开导航和仓库静态配置。低频项集中在这里，日常写作路径保持轻一点。</p>
        </div>
        <div className="settings-header-actions">
          <Link href="/">查看前台</Link>
          <Link href="/admin/export">导入导出</Link>
          <button type="submit" disabled={settingsBusy} aria-disabled={settingsBusy}>
            {state === 'submitting' ? '保存中' : '保存设置'}
          </button>
        </div>
      </div>
      {message ? <p className={`form-message form-message--${state}`} role="status" aria-live="polite">{message}</p> : null}
      <div className="settings-layout">
        <section className="settings-section settings-section--primary settings-group">
          <div className="settings-group__copy settings-section__header">
            <span>Profile</span>
            <h2>公开身份</h2>
            <p>控制公开页面的站点名称、站主名称、SEO 描述和社交入口。</p>
          </div>
          <div className="settings-card">
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
          </div>
        </section>

        <section className="settings-section settings-group">
          <div className="settings-group__copy settings-section__header">
            <span>Home</span>
            <h2>首页展示</h2>
            <p>管理首页短句、箴言和备用背景，影响前台首页第一屏观感。</p>
          </div>
          <div className="settings-card">
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
          </div>
        </section>

        <section className="settings-section settings-section--compact settings-group">
          <div className="settings-group__copy settings-section__header">
            <span>Appearance</span>
            <h2>外观维护</h2>
            <p>只保留主题、首页模块和背景图这类高价值控制。不开放细粒度文章排版。</p>
          </div>
          <div className="settings-card">
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
            <p className="settings-inline-note">正文宽度、字号、行高和代码块样式继续由公共主题统一保证。</p>
          </div>
        </section>

        <section className="settings-section settings-section--compact settings-group">
          <div className="settings-group__copy settings-section__header">
            <span>Navigation</span>
            <h2>公开导航</h2>
            <p>勾选公开导航入口，保存后影响前台顶部导航。搜索入口会保留顶部搜索框。</p>
          </div>
          <div className="settings-card">
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
          </div>
        </section>

        <section className="settings-section settings-section--compact settings-group">
          <div className="settings-group__copy settings-section__header">
            <span>Maintenance</span>
            <h2>仓库维护</h2>
            <p>素材、分类索引、导入导出和仓库保存说明属于低频维护，不进入默认写作路径。</p>
          </div>
          <div className="settings-card">
            <p className="settings-safety-note">静态站模式下，设置保存会提示修改仓库文件并提交部署。</p>
            <div className="settings-maintenance-grid" aria-label="仓库维护入口">
              <Link href="/admin/assets">
                <strong>素材维护</strong>
                <small>检查上传图片和可复用素材。</small>
              </Link>
              <Link href="/admin/taxonomy">
                <strong>分类索引</strong>
                <small>查看由内容元数据派生的分类、标签和专题。</small>
              </Link>
              <Link href="/admin/export">
                <strong>导入导出</strong>
                <small>处理内容备份、迁移和仓库说明。</small>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}
