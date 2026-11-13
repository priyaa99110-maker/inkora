import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAppearance } from "@/components/appearance-provider";
import {
  ACCENT_PRESETS,
  COLOR_SLOTS,
  EMPTY_COLORS,
  FONTS,
  LETTER_SPACINGS,
  LINE_SPACINGS,
  SCALES,
  THEMES,
  type FontKey,
  type ScaleKey,
  type SpacingKey,
} from "@/lib/theme";
import { LogOut, Moon, Sun, Palette, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Inkora" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { appearance, setAppearance } = useAppearance();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setLoadError("Your sign-in has expired. Please sign in again.");
        return;
      }
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (error) throw error;
      if (!data) {
        setLoadError("Your settings profile could not be found. Please try again.");
        return;
      }
      setProfile(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Your settings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { data: u, error: userError } = await supabase.auth.getUser();
      if (userError || !u.user) throw userError ?? new Error("Please sign in again to save your settings.");
      const { data, error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          nickname: profile.nickname,
          daily_goal: profile.daily_goal,
          reminder_time: profile.reminder_time,
          theme: appearance.theme,
          accent_color: appearance.accent || null,
          dark_mode: appearance.dark,
          font_family: appearance.font,
          font_scale: appearance.scale,
          letter_spacing: appearance.letterSpacing,
          line_spacing: appearance.lineSpacing,
          custom_colors: appearance.colors,
        })
        .eq("id", u.user.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("No settings were saved. Please reload and try again.");
      toast.success("Settings saved ✿");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your settings could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await qc.cancelQueries();
      qc.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "You couldn't be signed out. Please try again.");
      setSigningOut(false);
    }
  };

  if (loading) return <AppShell title="Settings"><DreamBackdrop /><p role="status">Loading your settings…</p></AppShell>;
  if (!profile) return (
    <AppShell title="Settings">
      <DreamBackdrop />
      <div className="mx-auto max-w-xl space-y-4" role="alert">
        <p className="text-sm text-destructive">{loadError || "Your settings could not be loaded."}</p>
        <Button variant="outline" onClick={() => void loadProfile()}>Try again</Button>
      </div>
    </AppShell>
  );

  return (
    <AppShell title="Settings">
      <DreamBackdrop />
      <div className="mx-auto max-w-xl space-y-6">
      <div className="glass-card space-y-4 p-6">
        <Field label="Name">
          <input className="input" value={profile.name ?? ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        </Field>
        <Field label="Nickname">
          <input className="input" value={profile.nickname ?? ""} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} />
        </Field>
        <Field label="Daily intention">
          <input className="input" value={profile.daily_goal ?? ""} onChange={(e) => setProfile({ ...profile, daily_goal: e.target.value })} />
        </Field>
        <Field label="Reminder time">
          <input type="time" className="input" value={profile.reminder_time ?? ""} onChange={(e) => setProfile({ ...profile, reminder_time: e.target.value })} />
        </Field>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        <hr className="border-border/60" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-muted-foreground">End your Inkora session on this device.</p>
          </div>
          <Button variant="outline" onClick={signOut} disabled={signingOut}>
            <LogOut className="h-4 w-4" /> {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </div>

      <section className="glass-card space-y-5 p-6">
        <header className="flex flex-wrap items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg">Appearance</h2>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <span className="text-[11px] text-muted-foreground">Save changes to keep your choices</span>
            <button
              onClick={() => setAppearance({ dark: !appearance.dark })}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs"
              aria-pressed={appearance.dark}
            >
              {appearance.dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              {appearance.dark ? "Dark" : "Light"} mode
            </button>
          </div>
        </header>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Theme</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setAppearance({ theme: t.key })}
                className={`flex items-center gap-2 rounded-2xl border p-3 text-left text-sm transition ${
                  appearance.theme === t.key
                    ? "border-primary bg-primary/10 shadow-soft"
                    : "border-border bg-card/60 hover:bg-card"
                }`}
              >
                <span
                  className="h-6 w-6 shrink-0 rounded-full border border-border"
                  style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
                />
                <span className="truncate">
                  {t.emoji} {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Accent colour</p>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((a) => (
              <button
                key={a.label}
                title={a.label}
                aria-label={a.label}
                onClick={() => setAppearance({ accent: a.value })}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  appearance.accent === a.value ? "border-foreground scale-110" : "border-border"
                }`}
                style={a.value ? { background: a.value } : { background: "var(--gradient-primary)" }}
              />
            ))}
            <label className="ml-1 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs">
              Custom
              <input
                type="color"
                value={appearance.accent || "#c86bd0"}
              onChange={(e) => setAppearance({ accent: e.target.value })}
                className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Font">
            <select
              className="input"
              value={appearance.font}
              onChange={(e) => setAppearance({ font: e.target.value as FontKey })}
            >
              {FONTS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Text size">
            <select
              className="input"
              value={appearance.scale}
              onChange={(e) => setAppearance({ scale: e.target.value as ScaleKey })}
            >
              {SCALES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Letter spacing">
            <select
              className="input"
              value={appearance.letterSpacing}
              onChange={(e) => setAppearance({ letterSpacing: e.target.value as SpacingKey })}
            >
              {LETTER_SPACINGS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Line spacing">
            <select
              className="input"
              value={appearance.lineSpacing}
              onChange={(e) => setAppearance({ lineSpacing: e.target.value as SpacingKey })}
            >
              {LINE_SPACINGS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your colours</p>
            <button
              onClick={() => setAppearance({ colors: EMPTY_COLORS })}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Reset to theme
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {COLOR_SLOTS.map((slot) => (
              <label
                key={slot.key}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3"
              >
                <input
                  type="color"
                  value={appearance.colors[slot.key] || slot.fallback}
                  onChange={(e) =>
                    setAppearance({ colors: { ...appearance.colors, [slot.key]: e.target.value } })
                  }
                  className="h-8 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label={`${slot.label} colour`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{slot.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{slot.hint}</span>
                </span>
                {appearance.colors[slot.key] && (
                  <button
                    onClick={() => setAppearance({ colors: { ...appearance.colors, [slot.key]: "" } })}
                    className="text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    Clear
                  </button>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Type className="h-3.5 w-3.5" /> Preview
          </div>
          <h3 className="mt-2 font-display text-xl text-gradient">A gentle evening reflection</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Today felt soft and slow — the kind of day worth remembering.
          </p>
          <span className="mt-3 inline-block rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground shadow-glow">
            Primary button
          </span>
          <p className="mt-3 journal-prose text-sm" style={{ minHeight: 0 }}>
            Sample body text with your letter and line spacing — <a href="#preview">an example link</a>.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground">Your profile and appearance choices are saved together.</p>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save all settings"}</Button>
        </div>
      </section>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:color-mix(in oklab, var(--color-card) 85%, transparent);border-radius:0.9rem;padding:.6rem .9rem;font-size:.95rem;outline:none}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
