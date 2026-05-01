type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;

  return (
    <main className="page-shell">
      <section className="panel">
        <p className="meta">Admin / User Detail</p>
        <h1>User {id}</h1>
        <p>Policy overrides, device list, session reset, and content metadata fit here.</p>
      </section>
    </main>
  );
}
