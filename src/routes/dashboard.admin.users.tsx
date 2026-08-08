import { useEffect, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard/admin/users")({
  head: () => ({ meta: [{ title: "User Management | AuraPass" }] }),
  component: UserManagement,
});

interface Row {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  role: string | null;
  roles: string[];
}

const GRANTABLE = ["organiser", "admin"] as const;

function UserManagement() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const db = supabase as any;
    const [{ data: profiles }, { data: userRoles }] = await Promise.all([
      db.from("profiles").select("id, full_name, username, email, role").order("created_at", { ascending: false }).limit(200),
      db.from("user_roles").select("user_id, role, status"),
    ]);

    const byUser = new Map<string, string[]>();
    for (const r of (userRoles as Array<{ user_id: string; role: string; status?: string }> | null) ?? []) {
      if (r.status && r.status !== "active") continue;
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
    }

    setRows(
      ((profiles as Array<Omit<Row, "roles">> | null) ?? []).map((p) => ({
        ...p,
        roles: byUser.get(p.id) ?? ["attendee"],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function grant(userId: string, role: string) {
    setBusy(`${userId}:${role}`);
    const { error } = await (supabase as any)
      .from("user_roles")
      .insert({ user_id: userId, role, status: "active" });
    setBusy(null);
    if (error) {
      toast.error(error.message ?? "Could not grant role");
      return;
    }
    toast.success(`Granted ${role}`);
    void load();
  }

  async function revoke(userId: string, role: string) {
    setBusy(`${userId}:${role}`);
    const { error } = await (supabase as any)
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    setBusy(null);
    if (error) {
      toast.error(error.message ?? "Could not revoke role");
      return;
    }
    toast.success(`Revoked ${role}`);
    void load();
  }

  const term = q.trim().toLowerCase();
  const filtered = term
    ? rows.filter((r) =>
        [r.full_name, r.username, r.email].some((v) => v?.toLowerCase().includes(term)),
      )
    : rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">User Management</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Grant or revoke roles. Roles live in the user_roles table.
        </p>
      </div>

      <Input
        placeholder="Search by name, username or email"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
              style={{ borderRadius: 12 }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">
                  {u.full_name ?? "Unnamed"}{" "}
                  {u.username ? (
                    <span className="font-normal text-[#6B7280]">@{u.username}</span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-[#6B7280]">{u.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <Badge key={r} variant="outline">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {GRANTABLE.map((role) =>
                  u.roles.includes(role) ? (
                    <Button
                      key={role}
                      variant="secondary"
                      size="sm"
                      loading={busy === `${u.id}:${role}`}
                      onClick={() => revoke(u.id, role)}
                    >
                      Revoke {role}
                    </Button>
                  ) : (
                    <Button
                      key={role}
                      variant="primary"
                      size="sm"
                      loading={busy === `${u.id}:${role}`}
                      onClick={() => grant(u.id, role)}
                    >
                      Grant {role}
                    </Button>
                  ),
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
