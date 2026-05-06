import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
      <div className="grid w-full gap-6 md:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/60 bg-white/75 shadow-xl shadow-amber-950/5 backdrop-blur">
          <CardHeader className="gap-4">
            <Badge variant="secondary" className="w-fit">
              User Registration
            </Badge>
            <CardTitle className="text-3xl">Create a basic email/password account.</CardTitle>
            <CardDescription>
              In this phase the mailbox is format-validated only. If the password is lost and all devices are gone,
              the account cannot be recovered.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-white/60 bg-white/90 shadow-xl shadow-amber-950/5">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>The desktop client will generate and submit its device name during actual signup.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="register-email">Email</Label>
                <Input id="register-email" type="email" placeholder="you@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="register-password">Password</Label>
                <Input id="register-password" type="password" placeholder="At least 8 characters" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button">Create Account</Button>
                <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
