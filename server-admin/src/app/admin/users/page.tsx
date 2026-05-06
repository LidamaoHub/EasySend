import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rows = [
  { email: "admin@example.com", status: "active", role: "admin", storage: "0 B" },
  { email: "demo@example.com", status: "active", role: "user", storage: "14 MB" },
];

export default function AdminUsersPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl px-6 py-10">
      <div className="grid w-full gap-6">
        <Card className="border-white/60 bg-white/85 shadow-xl shadow-amber-950/5">
          <CardHeader className="gap-4 border-b">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <Badge variant="secondary" className="w-fit">
                  Admin / Users
                </Badge>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <Users className="size-6" />
                  Users, policies, sessions, and storage visibility live here.
                </CardTitle>
                <CardDescription>
                  This page will eventually bind to the admin list and detail APIs already scaffolded in the backend.
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Input placeholder="Search by email" className="w-64" />
                <Button variant="outline">Refresh</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Storage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.email}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "active" ? "secondary" : "outline"}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>{row.storage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
