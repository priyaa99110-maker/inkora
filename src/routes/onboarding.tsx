import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { Sparkles } from "lucide-react";
import { THEMES } from "@/lib/theme";
import { useAppearance } from "@/components/appearance-provider";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Inkora" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { setAppearance } = useAppearance();
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    birthday: "",
    daily_goal: "",
    reminder_time: "21:00",
    theme: "butterfly-dream",
  });

  const save = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return navigate({ to: "/auth" });
    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name || null,
        nickname: form.nickname || null,
        birthday: form.birthday || null,
        daily_goal: form.daily_goal || null,
        reminder_time: form.reminder_time || null,
        theme: form.theme,
        onboarded: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      .eq("id", user.user.id);
    if (error) return toast.error(error.message);
    toast.success("Your journal is ready ✿");
    navigate({ to: "/dashboard" });
  };

  const steps = [
    {
      title: "What should we call you?",
      body: (
        <div className="space-y-3">
          <Input placeholder="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input placeholder="Nickname (optional)" value={form.nickname} onChange={(v) => setForm({ ...form, nickname: v })} />
        </div>
      ),
    },
    {
      title: "A little about you",
      body: (
        <div className="space-y-3">
          <label className="block text-xs text-muted-foreground">Birthday</label>
          <Input type="date" value={form.birthday} onChange={(v) => setForm({ ...form, birthday: v })} />
          <label className="mt-2 block text-xs text-muted-foreground">A daily intention</label>
          <Input placeholder="Be gentle with myself" value={form.daily_goal} onChange={(v) => setForm({ ...form, daily_goal: v })} />
        </div>
      ),
    },
    {
      title: "When should we whisper a reminder?",
      body: (
        <div className="space-y-3">
          <Input type="time" value={form.reminder_time} onChange={(v) => setForm({ ...form, reminder_time: v })} />
          <p className="text-xs text-muted-foreground">We'll softly nudge you to reflect at this time.</p>
        </div>
      ),
    },
    {
      title: "Pick your theme",
      body: (
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setForm({ ...form, theme: t.key });
                setAppearance({ theme: t.key });
              }}
              className={`flex items-center gap-2 rounded-2xl border p-4 text-left transition ${
                form.theme === t.key ? "border-primary bg-primary/10" : "border-border bg-card/60"
              }`}
            >
              <span
                className="h-6 w-6 shrink-0 rounded-full border border-border"
                style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
              />
              <span className="truncate font-display text-sm">
                {t.emoji} {t.label}
              </span>
            </button>
          ))}
        </div>
      ),
    },
  ];

  const s = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4">
      <DreamBackdrop />
      <div className="glass-card w-full max-w-lg p-8 animate-fade-up">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Step {step + 1} of {steps.length}</span>
        </div>
        <h1 className="font-display text-3xl">{s.title}</h1>
        <div className="mt-6">{s.body}</div>
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            className="text-sm text-muted-foreground disabled:opacity-40"
            disabled={step === 0}
          >
            Back
          </button>
          <button
            onClick={() => (last ? save() : setStep(step + 1))}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-glow"
          >
            {last ? "Enter my journal" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-border bg-white/70 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/40"
    />
  );
}
