type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl px-6 py-10">
      <section className="grid w-full gap-6">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl shadow-amber-950/5">
            <p className="text-sm font-medium text-muted-foreground">Admin / User Detail</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">User {id}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Policy overrides, device list, session reset, and content metadata fit here.
            </p>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-amber-950/5">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span>user</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File quota</span>
                <span>100 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Text quota</span>
                <span>100 MB</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
