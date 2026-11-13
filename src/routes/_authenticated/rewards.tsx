import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { htmlToPlainText } from "@/lib/editor-utils";
import { buildBadges, buildStats, type GameStats } from "@/lib/gamification";
import { Copy, Flame, Gift, Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards & Streaks — Inkora" },
      { name: "description", content: "Track your journaling streak, level up with XP, earn badges and invite friends." },
      { property: "og:title", content: "Rewards & Streaks — Inkora" },
      { property: "og:description", content: "Streaks, badges and referrals for your journaling habit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [code, setCode] = useState("");
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [{ data: entries }, { data: profile }] = await Promise.all([
      supabase.from("diary_entries").select("entry_date, content"),
      supabase
        .from("profiles")
        .select("referral_code, referral_count, referred_by, xp")
        .eq("id", u.user.id)
        .maybeSingle(),
    ]);
    const rows = (entries as { entry_date: string; content: string }[]) ?? [];
    const words = rows.reduce(
      (sum, r) => sum + htmlToPlainText(r.content ?? "").split(/\s+/).filter(Boolean).length,
      0,
    );
    const p = profile as
      | { referral_code: string | null; referral_count: number; referred_by: string | null; xp: number }
      | null;
    setCode(p?.referral_code ?? "");
    setReferredBy(p?.referred_by ?? null);
    setStats(
      buildStats({
        entryDates: rows.map((r) => r.entry_date),
        words,
        referrals: p?.referral_count ?? 0,
        bonusXp: p?.xp ?? 0,
      }),
    );
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badges = useMemo(() => (stats ? buildBadges(stats) : []), [stats]);

  const redeem = async () => {
    const value = input.trim().toUpperCase();
    if (value.length < 4) return toast.error("Enter your friend's code");
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("redeem_referral", { _code: value });
      if (error) throw error;
      const result = data as { ok: boolean; error?: string };
      if (!result?.ok) return toast.error(result?.error ?? "Could not redeem that code");
      toast.success("Code redeemed — you both earned XP ✿");
      setInput("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Referral code copied");
  };

  if (!stats) {
    return (
      <AppShell title="Rewards">
        <DreamBackdrop />
        <div className="h-40 animate-pulse rounded-3xl bg-muted/40" aria-hidden />
      </AppShell>
    );
  }

  const progress = Math.round((stats.intoLevel / stats.levelSpan) * 100);

  return (
    <AppShell title="Rewards">
      <DreamBackdrop />
      <div className="space-y-6">
        <section className="glass-card p-8 animate-fade-up">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/15 text-3xl">🦋</span>
            <div className="min-w-40 flex-1">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Level {stats.level}</p>
              <h2 className="font-display text-3xl">{stats.levelLabel}</h2>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {stats.xp} XP · {Math.max(0, stats.nextLevelXp - stats.xp)} XP to the next level
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile icon={Flame} label="Current streak" value={`${stats.streak} days`} />
          <Tile icon={Trophy} label="Longest streak" value={`${stats.longestStreak} days`} />
          <Tile icon={Sparkles} label="Words written" value={stats.words.toLocaleString()} />
          <Tile icon={Gift} label="Friends invited" value={stats.referrals} />
        </section>

        <section className="glass-card p-6">
          <h3 className="font-display text-xl">Invite a friend</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your code. When a friend redeems it, you both earn XP and unlock new journal features.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-lg tracking-widest">
              {code || "—"}
            </span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs"
            >
              <Copy className="h-3.5 w-3.5" /> Copy code
            </button>
          </div>

          <div className="mt-6 border-t border-border/60 pt-4">
            {referredBy ? (
              <p className="text-sm text-muted-foreground">You've already redeemed a friend's code ✿</p>
            ) : (
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Got a friend's code?
                  </span>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value.toUpperCase())}
                    placeholder="ABCD1234"
                    maxLength={12}
                    className="rounded-2xl border border-border bg-card/70 px-4 py-2 font-mono text-sm tracking-widest outline-none"
                  />
                </label>
                <button
                  onClick={redeem}
                  disabled={busy}
                  className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground shadow-glow disabled:opacity-60"
                >
                  Redeem
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="glass-card p-6">
          <h3 className="mb-4 font-display text-xl">Badges</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map((b) => (
              <div
                key={b.key}
                className={`rounded-2xl border p-4 transition ${
                  b.earned ? "border-primary/50 bg-primary/10" : "border-border/60 bg-card/40 opacity-80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${b.earned ? "" : "grayscale"}`}>{b.emoji}</span>
                  <span className="font-display text-base">{b.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                {b.unlocks && (
                  <p className="mt-1 text-[11px] text-primary">
                    {b.earned ? "Unlocked: " : "Unlocks: "}
                    {b.unlocks}
                  </p>
                )}
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${Math.round(b.progress * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl">{value}</div>
    </div>
  );
}
