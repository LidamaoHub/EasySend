export default function LoginPage() {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="meta">User Login</p>
        <h1>Sign in from desktop or mobile clients.</h1>
        <p>This page is mainly for admin-side testing during early development.</p>
        <form className="form">
          <label className="field">
            <span>Email</span>
            <input type="email" placeholder="you@example.com" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" placeholder="••••••••" />
          </label>
          <div className="button-row">
            <button className="button" type="button">
              Continue
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
