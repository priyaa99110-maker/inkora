import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/todo")({
  head: () => ({ meta: [{ title: "To-do — Inkora" }] }),
  component: TodoPage,
});

type Task = {
  id: string;
  title: string;
  list_key: string;
  priority: string;
  completed: boolean;
};

const lists = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "upcoming", label: "Upcoming" },
];

function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [text, setText] = useState("");
  const [listKey, setListKey] = useState("today");
  const [celebrate, setCelebrate] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("id,title,list_key,priority,completed")
      .order("created_at", { ascending: false });
    setTasks((data as Task[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!text.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("tasks")
      .insert({ user_id: u.user.id, title: text.trim(), list_key: listKey });
    if (error) return toast.error(error.message);
    setText("");
    load();
  };

  const toggle = async (t: Task) => {
    const done = !t.completed;
    await supabase
      .from("tasks")
      .update({ completed: done, completed_at: done ? new Date().toISOString() : null })
      .eq("id", t.id);
    load();
    if (done) {
      const remainingToday = tasks.filter(
        (x) => x.list_key === "today" && !x.completed && x.id !== t.id
      ).length;
      if (t.list_key === "today" && remainingToday === 0) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 3500);
      }
    }
  };

  const remove = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  };

  return (
    <AppShell title="To-do">
      <DreamBackdrop />
      {celebrate && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
          <div className="animate-fade-up rounded-3xl bg-white/80 px-8 py-6 text-center shadow-glow backdrop-blur">
            <div className="text-4xl">🦋 ✨ 🦋</div>
            <div className="mt-2 font-display text-xl">All done for today</div>
            <div className="text-sm text-muted-foreground">Rest, you did beautifully.</div>
          </div>
        </div>
      )}
      <div className="glass-card mb-6 flex flex-col gap-3 p-5 md:flex-row md:items-center">
        <select
          value={listKey}
          onChange={(e) => setListKey(e.target.value)}
          className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm"
        >
          {lists.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a gentle task…"
          className="flex-1 rounded-full border border-border bg-white/70 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={add}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {lists.map((l) => {
          const items = tasks.filter((t) => t.list_key === l.key);
          return (
            <div key={l.key} className="glass-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg">{l.label}</h3>
                <span className="text-xs text-muted-foreground">
                  {items.filter((i) => !i.completed).length} left
                </span>
              </div>
              <div className="space-y-2">
                {items.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground">Nothing here — soft is good.</p>
                )}
                {items.map((t) => (
                  <div
                    key={t.id}
                    className={`group flex items-center gap-3 rounded-2xl bg-white/60 p-3 transition hover:bg-white/80 ${
                      t.completed ? "opacity-60" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggle(t)}
                      className="h-4 w-4 accent-[oklch(0.7_0.14_320)]"
                    />
                    <span className={`flex-1 text-sm ${t.completed ? "line-through" : ""}`}>{t.title}</span>
                    <button
                      onClick={() => remove(t.id)}
                      className="text-muted-foreground opacity-0 transition group-hover:opacity-100"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
