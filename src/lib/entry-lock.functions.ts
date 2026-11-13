import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;

const SecretSchema = z
  .string()
  .trim()
  .min(4, "Use at least 4 characters")
  .max(64, "That's too long");

/** Sets or replaces the PIN/password on an entry. Requires the current secret when one exists. */
export const setEntryLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        entryId: z.string().uuid(),
        secret: SecretSchema,
        currentSecret: z.string().trim().max(64).optional(),
        hint: z.string().trim().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { hashSecret, newSalt, safeEqual } = await import("./entry-lock.server");
    const { supabase, userId } = context;

    const { data: entry, error } = await supabase
      .from("diary_entries")
      .select("id,lock_hash,lock_salt")
      .eq("id", data.entryId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!entry) throw new Error("Entry not found");

    if (entry.lock_hash && entry.lock_salt) {
      const current = data.currentSecret ?? "";
      const currentHash = await hashSecret(current, entry.lock_salt);
      if (!safeEqual(currentHash, entry.lock_hash)) throw new Error("Current PIN is incorrect");
    }

    const salt = newSalt();
    const hash = await hashSecret(data.secret, salt);
    const { error: upErr } = await supabase
      .from("diary_entries")
      .update({
        lock_hash: hash,
        lock_salt: salt,
        lock_hint: data.hint || null,
        lock_failed_attempts: 0,
        lock_locked_until: null,
      })
      .eq("id", data.entryId)
      .eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);
    return { locked: true as const };
  });

/** Verifies the secret and returns the entry content when correct. */
export const unlockEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ entryId: z.string().uuid(), secret: z.string().trim().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { hashSecret, safeEqual } = await import("./entry-lock.server");
    const { supabase, userId } = context;

    const { data: entry, error } = await supabase
      .from("diary_entries")
      .select("id,content,lock_hash,lock_salt,lock_failed_attempts,lock_locked_until")
      .eq("id", data.entryId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!entry) throw new Error("Entry not found");
    if (!entry.lock_hash || !entry.lock_salt) return { content: entry.content };

    if (entry.lock_locked_until && new Date(entry.lock_locked_until) > new Date()) {
      throw new Error("Too many attempts. Try again in a few minutes.");
    }

    const hash = await hashSecret(data.secret, entry.lock_salt);
    if (!safeEqual(hash, entry.lock_hash)) {
      const attempts = (entry.lock_failed_attempts ?? 0) + 1;
      await supabase
        .from("diary_entries")
        .update({
          lock_failed_attempts: attempts,
          lock_locked_until:
            attempts >= MAX_ATTEMPTS
              ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
              : null,
        })
        .eq("id", data.entryId)
        .eq("user_id", userId);
      throw new Error(
        attempts >= MAX_ATTEMPTS
          ? `Too many attempts. Locked for ${LOCKOUT_MINUTES} minutes.`
          : `Incorrect PIN — ${MAX_ATTEMPTS - attempts} tries left`,
      );
    }

    await supabase
      .from("diary_entries")
      .update({ lock_failed_attempts: 0, lock_locked_until: null })
      .eq("id", data.entryId)
      .eq("user_id", userId);
    return { content: entry.content };
  });

/** Removes the lock after verifying the current secret. */
export const removeEntryLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ entryId: z.string().uuid(), secret: z.string().trim().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { hashSecret, safeEqual } = await import("./entry-lock.server");
    const { supabase, userId } = context;

    const { data: entry, error } = await supabase
      .from("diary_entries")
      .select("id,lock_hash,lock_salt")
      .eq("id", data.entryId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!entry?.lock_hash || !entry.lock_salt) return { locked: false as const };

    const hash = await hashSecret(data.secret, entry.lock_salt);
    if (!safeEqual(hash, entry.lock_hash)) throw new Error("Incorrect PIN");

    const { error: upErr } = await supabase
      .from("diary_entries")
      .update({
        lock_hash: null,
        lock_salt: null,
        lock_hint: null,
        lock_failed_attempts: 0,
        lock_locked_until: null,
      })
      .eq("id", data.entryId)
      .eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);
    return { locked: false as const };
  });