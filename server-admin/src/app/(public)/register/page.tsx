export default function RegisterPage() {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="meta">User Registration</p>
        <h1>Create a basic email/password account.</h1>
        <p>Registration does not verify the mailbox in phase one.</p>
        <form className="form">
          <label className="field">
            <span>Email</span>
            <input type="email" placeholder="you@example.com" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" placeholder="At least 8 characters" />
          </label>
          <div className="button-row">
            <button className="button" type="button">
              Create Account
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
