import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEMO_ADMIN_EMAIL = "pihuadmin@gmail.com";
const DEMO_ADMIN_PASSWORD = "Pihu@112233";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

/**
 * Idempotently ensure the demo admin user exists and has admin role.
 * Safe to call from anywhere (unauthenticated). Returns the demo creds.
 */
export const ensureDemoAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Find existing user by email
  let userId: string | null = null;
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);
  const existing = list.users.find((u) => u.email?.toLowerCase() === DEMO_ADMIN_EMAIL);
  if (existing) {
    userId = existing.id;
    // Ensure password is the demo one (reset each call to keep demo working)
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: DEMO_ADMIN_PASSWORD,
      email_confirm: true,
    });
  } else {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Admin" },
    });
    if (createErr) throw new Error(createErr.message);
    userId = created.user!.id;
  }

  // Ensure profile exists
  await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId!, email: DEMO_ADMIN_EMAIL, name: "Inkora Admin", onboarded: true }, { onConflict: "id" });

  // Ensure admin role
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId!, role: "admin" }, { onConflict: "user_id,role" });

  return { email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD };
});

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (authErr) throw new Error(authErr.message);

    const ids = authList.users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }, { data: counts }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, name, nickname, avatar_url, onboarded").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin.from("diary_entries").select("user_id").in("user_id", ids),
    ]);
    const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const rMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const list = rMap.get(r.user_id) ?? [];
      list.push(r.role);
      rMap.set(r.user_id, list);
    });
    const cMap = new Map<string, number>();
    (counts ?? []).forEach((c: any) => cMap.set(c.user_id, (cMap.get(c.user_id) ?? 0) + 1));

    return authList.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned_until: (u as any).banned_until ?? null,
      profile: pMap.get(u.id) ?? null,
      roles: rMap.get(u.id) ?? [],
      diary_count: cMap.get(u.id) ?? 0,
    }));
  });

export const listEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "diary" | "gratitude" | "mood"; onlyFlagged?: boolean }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const table =
      data.kind === "diary" ? "diary_entries" : data.kind === "gratitude" ? "gratitude_entries" : "mood_entries";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from(table).select("*").order("created_at", { ascending: false }).limit(200);
    if (data.onlyFlagged) q = q.eq("flagged", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email")
      .in("id", ids);
    const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (rows ?? []).map((r: any) => ({ ...r, author: pMap.get(r.user_id) ?? null }));
  });

export const flagEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      kind: "diary" | "gratitude" | "mood";
      id: string;
      flagged: boolean;
      reason?: string;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const table =
      data.kind === "diary" ? "diary_entries" : data.kind === "gratitude" ? "gratitude_entries" : "mood_entries";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = data.flagged
      ? {
          flagged: true,
          flag_reason: data.reason ?? "Violates policy",
          flagged_at: new Date().toISOString(),
          flagged_by: context.userId,
        }
      : { flagged: false, flag_reason: null, flagged_at: null, flagged_by: null };
    const { error } = await supabaseAdmin.from(table).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "diary" | "gratitude" | "mood"; id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const table =
      data.kind === "diary" ? "diary_entries" : data.kind === "gratitude" ? "gratitude_entries" : "mood_entries";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendMagicResetLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (!user?.user?.email) throw new Error("User has no email");
    const redirectTo =
      (process.env.PUBLIC_APP_URL ?? "https://serenefall-journal.lovable.app") + "/reset-password";
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: user.user.email,
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
    return { email: user.user.email, action_link: link.properties?.action_link ?? null };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "admin" | "moderator" | "user"; grant: boolean }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    }
    return { ok: true };
  });

export const _unused = z; // keep import
