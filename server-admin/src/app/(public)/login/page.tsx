import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
      <div className="grid w-full gap-6 md:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/60 bg-white/75 shadow-xl shadow-amber-950/5 backdrop-blur">
          <CardHeader className="gap-4">
            <Badge variant="secondary" className="w-fit">
              User Login
            </Badge>
            <CardTitle className="text-3xl">Sign in from desktop or mobile clients.</CardTitle>
            <CardDescription>
              This web page is mainly for local testing while the real user-facing product lives in the Tauri and mobile apps.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-white/60 bg-white/90 shadow-xl shadow-amber-950/5">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Email is only used for identity. No mailbox verification in phase one.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button">Continue</Button>
                <Link href="/register" className={buttonVariants({ variant: "outline" })}>
                  Create account
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
