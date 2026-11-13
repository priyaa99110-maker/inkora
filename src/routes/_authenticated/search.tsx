import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { htmlToPlainText } from "@/lib/editor-utils";
import { ENTRY_TEMPLATES } from "@/lib/entry-templates";
import { format } from "date-fns";
import { Lock, Search as SearchIcon, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Search — Inkora" },
      { name: "description", content: "Search your diary by words, mood, tag, template, date range and favorites." },
      { property: "og:title", content: "Search — Inkora" },
      { property: "og:description", content: "Find any page of your journal in seconds." },
    ],
  }),
  component: SearchPage,
});

type Row = {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string[] | null;
  template: string | null;
  is_favorite: boolean;
  entry_date: string;
  lock_hash: string | null;
};

const moods = ["😊", "😌", "😢", "😴", "😡", "😍", "😰", "😇"];

function SearchPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [template, setTemplate] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [lockedOnly, setLockedOnly] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("diary_entries")
        .select("id,title,content,mood,tags,template,is_favorite,entry_date,lock_hash")
        .order("entry_date", { ascending: false });
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const allTags = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.tags ?? []))).sort(), [rows]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (favoritesOnly && !r.is_favorite) return false;
      if (lockedOnly && !r.lock_hash) return false;
      if (mood && r.mood !== mood) return false;
      if (tag && !(r.tags ?? []).includes(tag)) return false;
      if (template && r.template !== template) return false;
      if (from && r.entry_date < from) return false;
      if (to && r.entry_date > to) return false;
      if (!needle) return true;
      const haystack = `${r.title ?? ""} ${r.lock_hash ? "" : htmlToPlainText(r.content)}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, q, mood, tag, template, from, to, favoritesOnly, lockedOnly]);

  const reset = () => {
    setQ("");
    setMood(null);
    setTag(null);
    setTemplate(null);
    setFrom("");
    setTo("");
    setFavoritesOnly(false);
    setLockedOnly(false);
  };

  return (
    <AppShell title="Search">
      <DreamBackdrop />
      <div className="space-y-5">
        <section className="glass-card p-5">
          <label className="flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-2">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles and words…"
              className="w-full bg-transparent text-sm outline-none"
              aria-label="Search entries"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Filter title="Mood">
              <div className="flex flex-wrap gap-1.5">
                {moods.map((m) => (
                  <Chip key={m} active={mood === m} onClick={() => setMood(mood === m ? null : m)}>
                    {m}
                  </Chip>
                ))}
              </div>
            </Filter>

            <Filter title="Date range">
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-full border border-border/60 bg-background/50 px-3 py-1"
                  aria-label="From date"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-full border border-border/60 bg-background/50 px-3 py-1"
                  aria-label="To date"
                />
              </div>
            </Filter>

            {allTags.length > 0 && (
              <Filter title="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((t) => (
                    <Chip key={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                      #{t}
                    </Chip>
                  ))}
                </div>
              </Filter>
            )}

            <Filter title="Template">
              <div className="flex flex-wrap gap-1.5">
                {ENTRY_TEMPLATES.map((t) => (
                  <Chip
                    key={t.key}
                    active={template === t.key}
                    onClick={() => setTemplate(template === t.key ? null : t.key)}
                  >
                    {t.label}
                  </Chip>
                ))}
              </div>
            </Filter>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Chip active={favoritesOnly} onClick={() => setFavoritesOnly((v) => !v)}>
              ★ Favorites
            </Chip>
            <Chip active={lockedOnly} onClick={() => setLockedOnly((v) => !v)}>
              🔒 Locked
            </Chip>
            <button onClick={reset} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
              Clear filters
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {loading ? "Searching…" : `${results.length} ${results.length === 1 ? "entry" : "entries"}`}
          </p>
          {!loading && results.length === 0 && (
            <div className="glass-card p-10 text-center">
              <h3 className="font-display text-xl">Nothing matches yet.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try fewer filters or a different word.</p>
            </div>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate({ to: "/diary", search: { entry: r.id } })}
              className="glass-card block w-full p-4 text-left transition hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                {r.mood && <span>{r.mood}</span>}
                {r.lock_hash && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="font-display text-lg">{r.title || "Untitled"}</span>
                {r.is_favorite && <Star className="ml-auto h-4 w-4 fill-gold text-gold" />}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {r.lock_hash ? "This entry is locked." : htmlToPlainText(r.content).slice(0, 220) || "Empty page"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {format(new Date(r.entry_date), "MMM d, yyyy")}
                {(r.tags ?? []).length > 0 && ` · ${(r.tags ?? []).map((t) => `#${t}`).join(" ")}`}
              </p>
            </button>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function Filter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border/60 text-muted-foreground hover:border-primary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
