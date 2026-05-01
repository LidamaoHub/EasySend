import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="panel hero">
        <p className="meta">VercelSend / Server + Admin</p>
        <h1>Single backend for desktop sync and admin control.</h1>
        <p>
          This service handles account auth, policies, text/file metadata, Blob
          upload authorization, and the admin panel.
        </p>
        <div className="button-row">
          <Link className="button" href="/login">
            User Login
          </Link>
          <Link className="button secondary" href="/register">
            Register
          </Link>
          <Link className="button secondary" href="/admin/login">
            Admin Panel
          </Link>
        </div>
        <div className="card-grid">
          <article className="card">
            <h2>API Shape</h2>
            <p className="meta">GET / POST only with Bearer token auth.</p>
          </article>
          <article className="card">
            <h2>Storage</h2>
            <p className="meta">Neon Postgres for records, private Vercel Blob for files.</p>
          </article>
          <article className="card">
            <h2>Retention</h2>
            <p className="meta">Text persisted, files expire after user policy cutoff.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
