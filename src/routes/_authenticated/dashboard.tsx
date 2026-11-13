import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { htmlToPlainText } from "@/lib/editor-utils";
import { differenceInCalendarDays, format, subDays } from "date-fns";
import { BookHeart, Flame, Heart, ListChecks, Search, Smile, Sparkles, Star, Tag as TagIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Inkora" },
      { name: "description", content: "Your writing streak, mood summary, activity and recent journal pages." },
      { property: "og:title", content: "Dashboard — Inkora" },
      { property: "og:description", content: "A gentle overview of your journaling." },
    ],
  }),
  component: Dashboard,
});

const quotes = [
  "Little by little, day by day, what is meant for you will find its way.",
  "Bloom slowly. There is no hurry in the sky.",
  "Every thought written is a tiny wing.",
  "Softness is a superpower.",
  "Today is a small poem. Write it kindly.",
];

type Entry = {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  is_favorite: boolean;
  entry_date: string;
  updated_at: string;
  created_at: string;
  lock_hash: string | null;
  tags: string[] | null;
};

function Dashboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [counts, setCounts] = useState({ gratitude: 0, tasks: 0 });
  const [moodRows, setMoodRows] = useState<{ mood: string; entry_date: string }[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: diary }, { count: gratitude }, { count: openT }, { data: moods }, { data: prof }] =
        await Promise.all([
          supabase
            .from("diary_entries")
            .select("id,title,content,mood,is_favorite,entry_date,updated_at,created_at,lock_hash,tags")
            .order("updated_at", { ascending: false }),
          supabase.from("gratitude_entries").select("*", { count: "exact", head: true }),
          supabase.from("tasks").select("*", { count: "exact", head: true }).eq("completed", false),
          supabase
            .from("mood_entries")
            .select("mood, entry_date")
            .gte("entry_date", format(subDays(new Date(), 29), "yyyy-MM-dd")),
          supabase.from("profiles").select("name").eq("id", u.user.id).maybeSingle(),
        ]);
      setEntries((diary as Entry[]) ?? []);
      setCounts({ gratitude: gratitude ?? 0, tasks: openT ?? 0 });
      setMoodRows((moods as { mood: string; entry_date: string }[]) ?? []);
      setName(((prof as { name: string | null } | null)?.name as string) ?? "friend");
      setLoading(false);
    })();
  }, []);

  const streak = useMemo(() => {
    const days = new Set(entries.map((e) => e.entry_date));
    let count = 0;
    let cursor = new Date();
    if (!days.has(format(cursor, "yyyy-MM-dd"))) cursor = subDays(cursor, 1);
    while (days.has(format(cursor, "yyyy-MM-dd"))) {
      count += 1;
      cursor = subDays(cursor, 1);
    }
    return count;
  }, [entries]);

  const activity = useMemo(() => {
    const days = Array.from({ length: 28 }, (_, i) => subDays(new Date(), 27 - i));
    const counts28: Record<string, number> = {};
    for (const e of entries) counts28[e.entry_date] = (counts28[e.entry_date] ?? 0) + 1;
    const data = days.map((d) => ({ date: d, value: counts28[format(d, "yyyy-MM-dd")] ?? 0 }));
    const max = Math.max(1, ...data.map((d) => d.value));
    return { data, max };
  }, [entries]);

  const moodSummary = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const m of moodRows) tally[m.mood] = (tally[m.mood] ?? 0) + 1;
    for (const e of entries) {
      if (e.mood && differenceInCalendarDays(new Date(), new Date(e.entry_date)) <= 29)
        tally[e.mood] = (tally[e.mood] ?? 0) + 1;
    }
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([mood, n]) => ({ mood, n, pct: total ? Math.round((n / total) * 100) : 0 }));
  }, [moodRows, entries]);

  const recentEdited = entries.slice(0, 4);
  const recentCreated = useMemo(
    () => [...entries].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4),
    [entries],
  );
  const favorites = useMemo(() => entries.filter((e) => e.is_favorite).slice(0, 6), [entries]);

  const tagCloud = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const e of entries) for (const t of e.tags ?? []) tally[t] = (tally[t] ?? 0) + 1;
    return Object.entries(tally).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries]);

  const visibleTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase().replace(/^#/, "");
    return (q ? tagCloud.filter(([t]) => t.toLowerCase().includes(q)) : tagCloud).slice(0, 40);
  }, [tagCloud, tagQuery]);

  const taggedEntries = useMemo(() => {
    if (!activeTags.length) return [];
    return entries.filter((e) => activeTags.every((t) => (e.tags ?? []).includes(t))).slice(0, 12);
  }, [entries, activeTags]);

  const toggleTag = (t: string) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const quote = quotes[new Date().getDate() % quotes.length];
  const open = (id: string) => navigate({ to: "/diary", search: { entry: id } });

  return (
    <AppShell title="Dashboard">
      <DreamBackdrop />
      <div className="space-y-6">
        <section className="glass-card p-8 animate-fade-up">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h2 className="mt-1 font-display text-3xl md:text-4xl">
            Hello, <span className="text-gradient">{name?.split(" ")[0] || "friend"}</span> ✿
          </h2>
          <p className="mt-3 font-quote text-lg text-muted-foreground">“{quote}”</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={BookHeart} label="Diary entries" value={entries.length} to="/diary" />
          <Stat icon={Flame} label="Day streak" value={streak} to="/diary" />
          <Stat icon={ListChecks} label="Open tasks" value={counts.tasks} to="/todo" />
          <Stat icon={Heart} label="Gratitudes" value={counts.gratitude} to="/gratitude" />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="glass-card p-6 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-xl">Last 28 days</h3>
              <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground">
                Open calendar
              </Link>
            </div>
            <div className="flex h-28 items-end gap-1">
              {activity.data.map((d) => (
                <div
                  key={d.date.toISOString()}
                  title={`${format(d.date, "MMM d")}: ${d.value} ${d.value === 1 ? "entry" : "entries"}`}
                  className="flex-1 rounded-t-md bg-primary/70 transition-all duration-500 hover:bg-primary"
                  style={{ height: `${Math.max(4, (d.value / activity.max) * 100)}%` }}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {format(activity.data[0].date, "MMM d")} — {format(new Date(), "MMM d")}
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-3 font-display text-xl">Mood this month</h3>
            {moodSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">No moods logged yet.</p>
            ) : (
              <div className="space-y-2">
                {moodSummary.map((m) => (
                  <div key={m.mood} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-lg">{m.mood}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs text-muted-foreground">{m.pct}%</span>
                  </div>
                ))}
              </div>
            )}
            <Link to="/mood" className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground">
              Log a mood
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <EntryList title="Recently edited" items={recentEdited} loading={loading} onOpen={open} />
          <EntryList title="Recently created" items={recentCreated} loading={loading} onOpen={open} />
        </section>

        <section className="glass-card p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <TagIcon className="h-4 w-4 text-primary" />
            <h3 className="font-display text-xl">Browse by tag</h3>
            {activeTags.length > 0 && (
              <button
                onClick={() => setActiveTags([])}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear ({activeTags.length})
              </button>
            )}
            <div className="ml-auto flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                placeholder="Find a tag…"
                aria-label="Find a tag"
                className="w-32 bg-transparent text-xs outline-none placeholder:text-muted-foreground/70 sm:w-44"
              />
            </div>
          </div>

          {tagCloud.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add tags while writing an entry and they'll appear here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {visibleTags.map(([t, n]) => {
                const on = activeTags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      on
                        ? "border-primary bg-primary/20 text-foreground shadow-soft"
                        : "border-border/60 text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                  >
                    #{t}
                    <span className="ml-1.5 opacity-60">{n}</span>
                  </button>
                );
              })}
              {visibleTags.length === 0 && (
                <p className="text-sm text-muted-foreground">No tags match “{tagQuery}”.</p>
              )}
            </div>
          )}

          {activeTags.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
              {taggedEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries with all of those tags.</p>
              ) : (
                taggedEntries.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => open(e.id)}
                    className="w-full rounded-2xl border border-border/50 bg-card/40 p-3 text-left transition hover:border-primary"
                  >
                    <div className="flex items-center gap-2">
                      {e.mood && <span>{e.mood}</span>}
                      <span className="truncate font-display text-base">{e.title || "Untitled"}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                        {format(new Date(e.entry_date), "MMM d")}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.lock_hash ? "Locked entry" : htmlToPlainText(e.content).slice(0, 120) || "Empty page"}
                    </p>
                  </button>
                ))
              )}
              <Link to="/search" className="inline-block text-xs text-muted-foreground hover:text-foreground">
                Open full search →
              </Link>
            </div>
          )}
        </section>

        <section className="glass-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <h3 className="font-display text-xl">Favorites</h3>
            <Link to="/search" className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Search className="h-3.5 w-3.5" /> Search all
            </Link>
          </div>
          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">Star an entry to keep it close.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favorites.map((f) => (
                <button
                  key={f.id}
                  onClick={() => open(f.id)}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs transition hover:border-primary hover:bg-primary/10"
                >
                  {f.mood ? `${f.mood} ` : ""}
                  {f.title || "Untitled"}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <QuickLink to="/diary" icon={BookHeart} kicker="Diary" title="Write today's page" sub="A quiet moment for your thoughts." />
          <QuickLink to="/gratitude" icon={Heart} kicker="Gratitude" title="Three good things" sub="Plant a small joy today." />
          <QuickLink to="/mood" icon={Smile} kicker="Mood" title="How are you?" sub="Notice, don't judge." />
          <QuickLink
            to="/rewards"
            icon={Flame}
            kicker="Rewards"
            title={`${streak}-day streak`}
            sub="Badges, XP and your referral code."
          />
        </section>
      </div>
    </AppShell>
  );
}

function EntryList({
  title,
  items,
  loading,
  onOpen,
}: {
  title: string;
  items: Entry[];
  loading: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="glass-card p-6">
      <h3 className="mb-3 font-display text-xl">{title}</h3>
      {loading && <div className="h-20 animate-pulse rounded-2xl bg-muted/40" aria-hidden />}
      {!loading && items.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
      <div className="space-y-2">
        {items.map((e) => (
          <button
            key={e.id}
            onClick={() => onOpen(e.id)}
            className="w-full rounded-2xl border border-border/50 bg-card/40 p-3 text-left transition hover:border-primary"
          >
            <div className="flex items-center gap-2">
              {e.mood && <span>{e.mood}</span>}
              <span className="truncate font-display text-base">{e.title || "Untitled"}</span>
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                {format(new Date(e.entry_date), "MMM d")}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {e.lock_hash ? "Locked entry" : htmlToPlainText(e.content).slice(0, 120) || "Empty page"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  kicker,
  title,
  sub,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  sub: string;
}) {
  return (
    <Link to={to} className="glass-card group flex items-center justify-between p-6 transition hover:-translate-y-1">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Icon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">{kicker}</span>
        </div>
        <h3 className="mt-2 font-display text-2xl">{title}</h3>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
      <Sparkles className="h-6 w-6 text-primary opacity-70 transition group-hover:rotate-12" />
    </Link>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  to: string;
}) {
  return (
    <Link to={to} className="glass-card block p-5 transition hover:-translate-y-1">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl">{value}</div>
    </Link>
  );
}
