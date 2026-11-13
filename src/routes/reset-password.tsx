import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { toast } from "sonner";
import { Feather } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import { passwordSchema, firstIssue } from "@/lib/password";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reset password — Inkora" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase places recovery tokens in the URL hash and creates a temp session.
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
      });
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issue = firstIssue(passwordSchema.safeParse(password));
    if (issue) return toast.error(issue);
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated ✿");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <DreamBackdrop />
      <div className="glass-card w-full max-w-md p-8 animate-fade-up">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/80 text-primary-foreground shadow-glow">
            <Feather className="h-4 w-4" />
          </span>
          <span className="font-display text-xl tracking-[0.2em] text-gradient">INKORA</span>
        </div>
        <h1 className="font-display text-3xl">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready ? "Choose something you'll remember." : "Verifying your reset link…"}
        </p>

        {ready && (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <PasswordField
              label="New password"
              value={password}
              onChange={setPassword}
              showStrength
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary py-2.5 font-medium text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:oklch(1 0 0 / 70%);border-radius:0.9rem;padding:.6rem .9rem;font-size:.95rem;outline:none;transition:box-shadow .2s}.input:focus{box-shadow:0 0 0 3px oklch(0.78 0.14 320 / 30%)}`}</style>
    </div>
  );
}
