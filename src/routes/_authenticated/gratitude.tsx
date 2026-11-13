import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Trash2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/gratitude")({
  head: () => ({ meta: [{ title: "Gratitude — Inkora" }] }),
  component: GratitudePage,
});

type G = { id: string; content: string; entry_date: string; created_at: string };

const prompts = [
  "Today I am grateful for…",
  "One small joy today was…",
  "Someone who helped me…",
  "A moment I want to remember…",
  "A tiny win I'm proud of…",
];

function GratitudePage() {
  const [items, setItems] = useState<G[]>([]);
  const [text, setText] = useState("");
  const prompt = prompts[new Date().getDate() % prompts.length];

  const load = async () => {
    const { data } = await supabase
      .from("gratitude_entries")
      .select("id,content,entry_date,created_at")
      .order("created_at", { ascending: false })
      .limit(60);
    setItems((data as G[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!text.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("gratitude_entries")
      .insert({ user_id: u.user.id, content: text.trim() });
    if (error) return toast.error(error.message);
    setText("");
    toast.success("Bloomed 🌸");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("gratitude_entries").delete().eq("id", id);
    load();
  };

  return (
    <AppShell title="Gratitude">
      <DreamBackdrop />
      <div className="glass-card mb-6 p-6">
        <div className="flex items-center gap-2 text-primary">
          <Heart className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Today's prompt</span>
        </div>
        <h2 className="mt-1 font-display text-2xl">{prompt}</h2>
        <div className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="…the warm cup of tea this morning"
            className="flex-1 rounded-full border border-border bg-white/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={add}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Plant your first joy above.</p>
        )}
        {items.map((g) => (
          <div key={g.id} className="glass-card group p-5">
            <div className="text-xs text-muted-foreground">
              {format(new Date(g.entry_date), "MMM d, yyyy")}
            </div>
            <p className="mt-1 font-quote text-lg leading-7">{g.content}</p>
            <button
              onClick={() => remove(g.id)}
              className="mt-3 text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100"
            >
              <Trash2 className="inline h-3 w-3" /> remove
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
