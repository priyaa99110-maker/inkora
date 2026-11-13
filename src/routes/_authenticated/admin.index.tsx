import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listUsers, sendMagicResetLink, setUserRole } from "@/lib/admin.functions";
import { Copy, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: UsersPage,
});

function UsersPage() {
  const router = useRouter();
  const fetchUsers = useServerFn(listUsers);
  const sendLink = useServerFn(sendMagicResetLink);
  const changeRole = useServerFn(setUserRole);
  const [q, setQ] = useState("");
  const [magic, setMagic] = useState<{ email: string; link: string | null } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin.users"],
    queryFn: () => fetchUsers({} as any),
  });

  const rows = (data ?? []).filter((u: any) => {
    if (!q) return true;
    const hay = `${u.email ?? ""} ${u.profile?.name ?? ""} ${u.profile?.nickname ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const handleReset = async (userId: string) => {
    try {
      const res = await sendLink({ data: { userId } });
      setMagic({ email: res.email, link: res.action_link });
      toast.success(`Magic reset link generated for ${res.email}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await changeRole({ data: { userId, role: "admin", grant: !isAdmin } });
      toast.success(isAdmin ? "Admin removed" : "Admin granted");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or name…"
          className="w-full max-w-sm rounded-full border border-border bg-white/70 px-4 py-2 text-sm outline-none"
        />
        <span className="ml-auto text-xs text-muted-foreground">{rows.length} users</span>
      </div>

      {magic && (
        <div className="mb-4 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
          <div className="mb-2 font-medium">Password reset link ready for {magic.email}</div>
          {magic.link ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={magic.link}
                className="flex-1 rounded-lg border border-border bg-white/80 px-2 py-1 text-xs"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(magic.link!);
                  toast("Copied ✿");
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
              <button onClick={() => setMagic(null)} className="text-xs text-muted-foreground">
                dismiss
              </button>
            </div>
          ) : (
            <p className="text-muted-foreground">Email delivery attempted.</p>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2">User</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Entries</th>
                <th>Last sign-in</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u: any) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-primary">
                          {(u.profile?.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{u.profile?.name ?? "—"}</div>
                          {u.profile?.nickname && (
                            <div className="text-xs text-muted-foreground">@{u.profile.nickname}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-xs">{u.email}</td>
                    <td>
                      {isAdmin ? (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                          admin
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">user</span>
                      )}
                    </td>
                    <td className="text-xs">{u.diary_count}</td>
                    <td className="text-xs text-muted-foreground">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "never"}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleReset(u.id)}
                          title="Send magic reset link"
                          className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs hover:bg-white"
                        >
                          <KeyRound className="h-3 w-3" /> Reset
                        </button>
                        <button
                          onClick={() => toggleAdmin(u.id, isAdmin)}
                          className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs hover:bg-white"
                        >
                          {isAdmin ? (
                            <>
                              <ShieldOff className="h-3 w-3" /> Revoke
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3 w-3" /> Promote
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
