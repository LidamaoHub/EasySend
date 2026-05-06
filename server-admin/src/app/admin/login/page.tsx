import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12">
      <Card className="w-full border-white/60 bg-white/88 shadow-xl shadow-amber-950/5">
        <CardHeader className="border-b bg-gradient-to-r from-stone-900 to-stone-700 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-white/10">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1">
              <Badge variant="secondary" className="bg-white/15 text-white">
                Admin Access
              </Badge>
              <CardTitle className="text-3xl">Administration is pre-seeded through environment configuration.</CardTitle>
              <CardDescription className="text-stone-200">
                Admin accounts use the same auth flow as normal users, but with elevated policy controls.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 p-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Admin can disable accounts, override quotas, clear sessions, and delete items without exposing user plaintext in the UI.</p>
            <p>In the deployed environment, seed admin credentials through prefixed environment variables.</p>
          </div>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-email">Admin email</Label>
              <Input id="admin-email" type="email" placeholder="admin@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" placeholder="••••••••" />
            </div>
            <Button type="button" className="w-fit">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
