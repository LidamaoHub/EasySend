export default function AdminUsersPage() {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="meta">Admin / Users</p>
        <h1>Users, policies, sessions, and storage visibility live here.</h1>
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Storage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Placeholder</td>
              <td>active</td>
              <td>admin</td>
              <td>0 B</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
