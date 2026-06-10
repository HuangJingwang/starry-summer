export default function LoginPage() {
  return (
    <main className="admin-main">
      <form className="login-panel">
        <p className="eyebrow">Owner only</p>
        <h1>登录</h1>
        <label>
          邮箱
          <input type="email" placeholder="owner@example.com" />
        </label>
        <label>
          密码
          <input type="password" placeholder="••••••••" />
        </label>
        <button type="button">登录</button>
      </form>
    </main>
  );
}
