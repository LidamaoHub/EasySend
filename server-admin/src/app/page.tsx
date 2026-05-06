import Link from "next/link";
import { ArrowRight, Database, LockKeyhole, PanelsTopLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const featureCards = [
  {
    title: "API Shape",
    description: "Only GET and POST endpoints with Bearer token auth for desktop and mobile clients.",
    icon: PanelsTopLeft,
  },
  {
    title: "Storage",
    description: "Neon Postgres stores metadata while Vercel Blob handles direct file transfer.",
    icon: Database,
  },
  {
    title: "Access Model",
    description: "Admin can manage users and policies without exposing normal user plaintext in the UI.",
    icon: LockKeyhole,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
      <section className="grid w-full gap-6">
        <Card className="overflow-hidden border-white/60 bg-white/80 shadow-2xl shadow-amber-950/5 backdrop-blur">
          <CardHeader className="gap-4 border-b bg-gradient-to-br from-amber-100/90 via-stone-50 to-white">
            <Badge variant="secondary" className="w-fit">
              VercelSend / Server + Admin
            </Badge>
            <div className="grid gap-3 md:grid-cols-[1.4fr_0.6fr] md:items-end">
              <div className="space-y-3">
                <CardTitle className="text-4xl leading-tight md:text-5xl">
                  Private sync backend for your desktop-first file relay.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base">
                  This app owns account auth, upload authorization, user policies, and the admin panel for
                  your LocalSend-style cloud inbox.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link href="/login" className={buttonVariants({ size: "lg" })}>
                  User Login
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Register
                </Link>
                <Link href="/admin/login" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  Admin Panel
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            {featureCards.map((feature) => (
              <Card key={feature.title} className="border-0 bg-stone-50/90 shadow-none ring-1 ring-amber-950/5">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-900">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
