export function LoginForm({ redirectTo = '/admin' }: { redirectTo?: string }) {
  return (
    <section className="login-panel" aria-label="静态站后台说明">
      <div className="login-panel__brand">
        <span className="login-panel__mark" aria-hidden="true">
          SS
        </span>
        <div>
          <p className="eyebrow">静态站模式</p>
          <h1>内容系统后台</h1>
          <p>这个站点不再使用后台账号密码。内容、配置和素材通过 git 提交更新，部署会从仓库文件重新生成。</p>
        </div>
      </div>
      <div className="login-panel__actions">
        <a href={redirectTo}>进入后台</a>
        <span>持久化修改请编辑 apps/web/content 和 apps/web/public/images，然后通过 git commit/push 发布。</span>
      </div>
      <p className="form-message form-message--success" role="status" aria-live="polite">
        静态站模式已启用：没有登录会话，也没有在线仓库写入。
      </p>
    </section>
  );
}
