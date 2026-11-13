import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { htmlToPlainText } from "@/lib/editor-utils";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Lock, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Inkora" },
      { name: "description", content: "Browse your journal by month or week and open any day's entries." },
      { property: "og:title", content: "Calendar — Inkora" },
      { property: "og:description", content: "Browse your journal by month or week." },
    ],
  }),
  component: CalendarPage,
});

type DayEntry = {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  is_favorite: boolean;
  entry_date: string;
  lock_hash: string | null;
};

type View = "month" | "week";

function CalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [moodByDate, setMoodByDate] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const start =
      view === "month" ? startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }) : startOfWeek(cursor, { weekStartsOn: 1 });
    const end = view === "month" ? addDays(start, 41) : endOfWeek(cursor, { weekStartsOn: 1 });
    return { start, end };
  }, [cursor, view]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = format(range.start, "yyyy-MM-dd");
      const to = format(range.end, "yyyy-MM-dd");
      const [{ data: d }, { data: m }] = await Promise.all([
        supabase
          .from("diary_entries")
          .select("id,title,content,mood,is_favorite,entry_date,lock_hash")
          .gte("entry_date", from)
          .lte("entry_date", to)
          .order("updated_at", { ascending: false }),
        supabase.from("mood_entries").select("mood, entry_date").gte("entry_date", from).lte("entry_date", to),
      ]);
      if (cancelled) return;
      setEntries((d as DayEntry[]) ?? []);
      const map: Record<string, string> = {};
      (m ?? []).forEach((r) => {
        map[(r as { entry_date: string }).entry_date] = (r as { mood: string }).mood;
      });
      setMoodByDate(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [range.start, range.end]);

  const byDate = useMemo(() => {
    const map: Record<string, DayEntry[]> = {};
    for (const e of entries) (map[e.entry_date] ??= []).push(e);
    return map;
  }, [entries]);

  const days = useMemo(() => {
    const count = view === "month" ? 42 : 7;
    return Array.from({ length: count }, (_, i) => addDays(range.start, i));
  }, [range.start, view]);

  const step = (dir: 1 | -1) =>
    setCursor((c) => (view === "month" ? addMonths(c, dir) : addWeeks(c, dir)));

  const label = view === "month" ? format(cursor, "MMMM yyyy") : `Week of ${format(range.start, "MMM d, yyyy")}`;

  return (
    <AppShell title="Calendar">
      <DreamBackdrop />
      <div className="glass-card p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor((c) => addYears(c, -1))}
              className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-primary/10"
              aria-label="Previous year"
            >
              «
            </button>
            <button onClick={() => step(-1)} className="rounded-full p-2 hover:bg-primary/10" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <h2 className="font-display text-2xl">{label}</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => step(1)} className="rounded-full p-2 hover:bg-primary/10" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor((c) => addYears(c, 1))}
              className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-primary/10"
              aria-label="Next year"
            >
              »
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCursor(new Date())}
              className="rounded-full border border-border/60 px-3 py-1 text-xs hover:border-primary"
            >
              Today
            </button>
            <div className="flex rounded-full border border-border/60 p-0.5 text-xs">
              {(["month", "week"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-full px-3 py-1 capitalize transition ${
                    view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className={`grid grid-cols-7 gap-1 transition-opacity duration-300 ${loading ? "opacity-50" : "opacity-100"}`}>
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const inMonth = view === "week" || d.getMonth() === cursor.getMonth();
            const dayEntries = byDate[key] ?? [];
            const mood = moodByDate[key] ?? dayEntries.find((e) => e.mood)?.mood;
            const today = isSameDay(d, new Date());
            const first = dayEntries[0];
            const preview = first
              ? `${first.title || "Untitled"}${
                  first.lock_hash ? " (locked)" : ` — ${htmlToPlainText(first.content).slice(0, 90)}`
                }`
              : undefined;
            return (
              <button
                key={key}
                type="button"
                title={preview}
                onClick={() =>
                  navigate({
                    to: "/diary",
                    search: { entry: first?.id },
                  })
                }
                className={`group relative min-h-[84px] rounded-2xl border p-2 text-left text-xs transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-soft ${
                  view === "week" ? "min-h-[150px]" : ""
                } ${inMonth ? "bg-card/60" : "bg-card/20 text-muted-foreground/60"} ${
                  today ? "border-primary ring-2 ring-primary/30" : "border-border/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={dayEntries.length ? "font-semibold text-foreground" : ""}>{format(d, "d")}</span>
                  {mood && <span aria-hidden>{mood}</span>}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEntries.slice(0, view === "week" ? 4 : 2).map((e) => (
                    <div key={e.id} className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      {e.lock_hash ? (
                        <Lock className="h-3 w-3 shrink-0" />
                      ) : e.is_favorite ? (
                        <Star className="h-3 w-3 shrink-0 fill-gold text-gold" />
                      ) : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                      <span className="truncate">{e.title || "Untitled"}</span>
                    </div>
                  ))}
                  {dayEntries.length > (view === "week" ? 4 : 2) && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayEntries.length - (view === "week" ? 4 : 2)} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
