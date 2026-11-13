import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/mood")({
  head: () => ({ meta: [{ title: "Mood — Inkora" }] }),
  component: MoodPage,
});

const moods = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "😍", label: "Excited" },
  { emoji: "😇", label: "Peaceful" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
];

type M = { id: string; mood: string; note: string | null; created_at: string };

function MoodPage() {
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [items, setItems] = useState<M[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("mood_entries")
      .select("id,mood,note,created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as M[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!selected) return toast("Pick a mood first");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("mood_entries")
      .insert({ user_id: u.user.id, mood: selected, note: note.trim() || null });
    if (error) return toast.error(error.message);
    setSelected(null);
    setNote("");
    toast.success("Noted with care ✿");
    load();
  };

  return (
    <AppShell title="Mood">
      <DreamBackdrop />
      <div className="glass-card p-6">
        <h2 className="font-display text-2xl">How are you, really?</h2>
        <p className="text-sm text-muted-foreground">Notice — don't judge.</p>
        <div className="mt-5 grid grid-cols-4 gap-3 md:grid-cols-8">
          {moods.map((m) => (
            <button
              key={m.emoji}
              onClick={() => setSelected(m.emoji)}
              className={`rounded-2xl p-3 text-center transition ${
                selected === m.emoji ? "bg-primary/20 ring-2 ring-primary" : "bg-white/60 hover:bg-white"
              }`}
            >
              <div className="text-3xl">{m.emoji}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {m.label}
              </div>
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="A quiet word about why…"
          className="mt-4 w-full rounded-2xl border border-border bg-white/70 p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          rows={3}
        />
        <button
          onClick={save}
          className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-glow"
        >
          Save mood
        </button>
      </div>

      <h3 className="mt-8 mb-3 font-display text-xl">Lately</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div key={m.id} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{m.mood}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(m.created_at), "MMM d, p")}
              </div>
            </div>
            {m.note && <p className="mt-2 text-sm">{m.note}</p>}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No moods yet — how does now feel?</p>
        )}
      </div>
    </AppShell>
  );
}
