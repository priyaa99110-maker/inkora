import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { Feather, Shield } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { ensureDemoAdmin } from "@/lib/admin.functions";
import { PasswordField } from "@/components/auth/password-field";
import { emailSchema, nameSchema, passwordSchema, firstIssue } from "@/lib/password";
import { setRememberMe } from "@/lib/session-policy";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — Inkora" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const seedAdmin = useServerFn(ensureDemoAdmin);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  const lockRemaining = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;
  const isLocked = lockRemaining > 0;

  const forgot = async () => {
    const emailIssue = firstIssue(emailSchema.safeParse(email));
    if (emailIssue) return toast.error(emailIssue);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Reset link sent — check your inbox ✿");
  };

  const loginAsDemoAdmin = async () => {
    setLoading(true);
    try {
      const creds = await seedAdmin({} as any);
      const { error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });
      if (error) throw error;
      toast.success("Signed in as pihuadmin@gmail.com");
      navigate({ to: "/admin" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      return toast.error(`Too many attempts — try again in ${lockRemaining}s`);
    }
    const issue = firstIssue(
      emailSchema.safeParse(email),
      ...(tab === "signup"
        ? [nameSchema.safeParse(name), passwordSchema.safeParse(password)]
        : []),
    );
    if (issue) return toast.error(issue);
    setLoading(true);
    try {
      setRememberMe(remember);
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Welcome to Inkora ✿");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setAttempts(0);
        setLockedUntil(null);
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      if (tab === "signin") {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          setAttempts(0);
          setNow(Date.now());
        }
      }
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    setRememberMe(remember);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <DreamBackdrop />
      <div className="glass-card w-full max-w-md p-8 animate-fade-up">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/80 text-primary-foreground shadow-glow">
            <Feather className="h-4 w-4" />
          </span>
          <span className="font-display text-xl tracking-[0.2em] text-gradient">INKORA</span>
        </Link>
        <h1 className="font-display text-3xl">
          {tab === "signin" ? "Welcome back" : "Begin your journal"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tab === "signin"
            ? "Slip back into your sanctuary."
            : "A soft space just for you."}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-full bg-muted p-1 text-sm">
          {(["signin", "signup"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full py-1.5 transition ${
                tab === k ? "bg-white shadow" : "text-muted-foreground"
              }`}
            >
              {k === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {tab === "signup" && (
            <Field label="Name">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your name"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </Field>
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            showStrength={tab === "signup"}
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--color-primary)]"
            />
            Keep me signed in on this device
          </label>
          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full rounded-full bg-primary py-2.5 font-medium text-primary-foreground shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {isLocked
              ? `Locked — ${lockRemaining}s`
              : loading
                ? "…"
                : tab === "signin"
                  ? "Sign in"
                  : "Create account"}
          </button>
          {tab === "signin" && (
            <button
              type="button"
              onClick={forgot}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password? Send me a magic reset link
            </button>
          )}
        </form>

        <button
          type="button"
          onClick={loginAsDemoAdmin}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20"
        >
          <Shield className="h-3 w-3" /> Demo login — pihuadmin@gmail.com
        </button>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          Password: <span className="font-mono">Pihu@112233</span>
        </p>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={google}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white py-2.5 text-sm font-medium hover:bg-white/80"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-4.9c-2 1.4-4.4 2.4-7 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.4 39.4 16.1 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.3 5.6l6 4.9c-.4.4 6.5-4.7 6.5-14.5 0-1.2-.1-2.4-.4-3.5z"/></svg>
          Continue with Google
        </button>
      </div>

      <style>{`.input{width:100%;border:1px solid var(--color-border);background:oklch(1 0 0 / 70%);border-radius:0.9rem;padding:.6rem .9rem;font-size:.95rem;outline:none;transition:box-shadow .2s}.input:focus{box-shadow:0 0 0 3px oklch(0.78 0.14 320 / 30%)}`}</style>
    </div>
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
