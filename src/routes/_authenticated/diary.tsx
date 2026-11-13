import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Lock, Plus, Star, Trash2 } from "lucide-react";
import { TemplatePicker } from "@/components/entry/template-picker";
import { TagEditor } from "@/components/entry/tag-editor";
import { EntryLock } from "@/components/entry/entry-lock";
import { PhotoGallery } from "@/components/entry/photo-gallery";
import { findTemplate } from "@/lib/entry-templates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// The editor bundle (TipTap + toolbar + AI panel) is loaded on demand.
const RichTextEditor = lazy(() =>
  import("@/components/editor/rich-text-editor").then((m) => ({ default: m.RichTextEditor })),
);

export const Route = createFileRoute("/_authenticated/diary")({
  validateSearch: (search: Record<string, unknown>) => ({
    entry: typeof search.entry === "string" ? search.entry : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Diary — Inkora" },
      { name: "description", content: "Write, format and revisit your private journal pages." },
      { property: "og:title", content: "Diary — Inkora" },
      { property: "og:description", content: "Write, format and revisit your private journal pages." },
    ],
  }),
  component: DiaryPage,
});

type Entry = {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  is_favorite: boolean;
  entry_date: string;
  updated_at: string;
  tags: string[] | null;
  template: string | null;
  lock_hash: string | null;
  lock_hint: string | null;
};

const moods = ["😊", "😌", "😢", "😴", "😡", "😍", "😰", "😇"];

const SELECT =
  "id,title,content,mood,is_favorite,entry_date,updated_at,tags,template,lock_hash,lock_hint";

function DiaryPage() {
  const { entry: entryParam } = Route.useSearch();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState<Entry | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("diary_entries")
      .select(SELECT)
      .order("updated_at", { ascending: false });
    const list = (data as Entry[]) ?? [];
    setEntries(list);
    const wanted = entryParam ? list.find((e) => e.id === entryParam) : undefined;
    if (wanted) setActive(wanted);
    else if (!active && list[0]) setActive(list[0]);
  };

  useEffect(() => { load(); }, [entryParam]);

  const allTags = useMemo(
    () => Array.from(new Set(entries.flatMap((e) => e.tags ?? []))).sort(),
    [entries],
  );

  const visible = useMemo(
    () =>
      entries.filter(
        (e) =>
          (!favoritesOnly || e.is_favorite) && (!tagFilter || (e.tags ?? []).includes(tagFilter)),
      ),
    [entries, favoritesOnly, tagFilter],
  );

  const isLocked = (e: Entry | null) => Boolean(e?.lock_hash) && !unlocked[e!.id];

  const create = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("diary_entries")
      .insert({ user_id: u.user.id, title: "New page", content: "" })
      .select(SELECT)
      .single();
    if (error) return toast.error(error.message);
    setActive(data as Entry);
    load();
  };

  const save = async () => {
    if (!active) return;
    setSaving(true);
    const { error } = await supabase
      .from("diary_entries")
      .update({
        title: active.title,
        content: active.content,
        mood: active.mood,
        is_favorite: active.is_favorite,
        tags: active.tags ?? [],
        template: active.template,
      })
      .eq("id", active.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved ✿");
    load();
  };

  const remove = async () => {
    if (!active || deleting) return;
    const entry = active;
    setDeleting(true);
    try {
      const { data: media, error: mediaError } = await supabase
        .from("entry_media")
        .select("storage_path")
        .eq("entry_id", entry.id);
      if (mediaError) throw mediaError;

      const { data: deleted, error } = await supabase
        .from("diary_entries")
        .delete()
        .eq("id", entry.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!deleted) throw new Error("This entry could not be deleted. Please refresh and try again.");

      setEntries((current) => current.filter((item) => item.id !== entry.id));
      if (active?.id === entry.id) setActive(null);
      setUnlocked((current) => {
        const next = { ...current };
        delete next[entry.id];
        return next;
      });
      setDeleteOpen(false);
      toast.success("Diary entry deleted.");

      const paths = (media ?? []).map((item) => item.storage_path);
      if (paths.length) {
        const { error: storageError } = await supabase.storage.from("entry-media").remove(paths);
        if (storageError) toast.error("The entry was deleted, but some attached photos could not be removed.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The diary entry could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell title="Diary">
      <DreamBackdrop />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="glass-card p-4">
          <button
            onClick={create}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2 text-sm font-medium text-primary-foreground shadow-glow"
          >
            <Plus className="h-4 w-4" /> New page
          </button>
          <div className="mb-3 space-y-2">
            <button
              onClick={() => setFavoritesOnly((v) => !v)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
                favoritesOnly ? "border-gold bg-gold/15 text-foreground" : "border-border/60 text-muted-foreground"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${favoritesOnly ? "fill-gold text-gold" : ""}`} /> Favorites
            </button>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTagFilter(tagFilter === t ? null : t)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                      tagFilter === t
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            {visible.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">Your notebook is blank. Begin?</p>
            )}
            {visible.map((e) => (
              <button
                key={e.id}
                onClick={() => setActive(e)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  active?.id === e.id ? "border-primary bg-primary/10" : "border-border/60 bg-white/50 hover:bg-white/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  {e.mood && <span>{e.mood}</span>}
                  {e.lock_hash && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Locked" />}
                  <div className="truncate font-display text-base">{e.title || "Untitled"}</div>
                  {e.is_favorite && <Star className="ml-auto h-3.5 w-3.5 fill-gold text-gold" />}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(e.entry_date), "MMM d, yyyy")}
                </div>
                {(e.tags ?? []).length > 0 && (
                  <div className="mt-1 truncate text-[11px] text-muted-foreground">
                    {(e.tags ?? []).map((t) => `#${t}`).join(" ")}
                  </div>
                )}
              </button>
            ))}
          </div>
        </aside>

        {active ? (
          <section className="glass-card relative p-6 md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-3 right-10 h-16 w-6 rounded-b-md bg-primary/70 shadow-soft"
            />
            <input
              value={active.title ?? ""}
              onChange={(e) => setActive({ ...active, title: e.target.value })}
              placeholder="A gentle title…"
              className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-muted-foreground/60"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Mood:</span>
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setActive({ ...active, mood: active.mood === m ? null : m })}
                  className={`rounded-full px-2 py-1 text-lg transition ${
                    active.mood === m ? "bg-primary/20" : "hover:bg-white/60"
                  }`}
                >
                  {m}
                </button>
              ))}
              <button
                onClick={() => setActive({ ...active, is_favorite: !active.is_favorite })}
                className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Favorite"
              >
                <Star className={`h-4 w-4 ${active.is_favorite ? "fill-gold text-gold" : ""}`} />
                Favorite
              </button>
            </div>

            <div className="mt-3">
              <TagEditor
                tags={active.tags ?? []}
                suggestions={allTags}
                onChange={(tags) => setActive((prev) => (prev ? { ...prev, tags } : prev))}
              />
            </div>

            <EntryLock
              entryId={active.id}
              hasLock={Boolean(active.lock_hash)}
              hint={active.lock_hint}
              unlocked={Boolean(unlocked[active.id])}
              onUnlocked={(content) => {
                setUnlocked((u) => ({ ...u, [active.id]: true }));
                setActive((prev) => (prev ? { ...prev, content } : prev));
              }}
              onLockChanged={(hasLock, hint) => {
                setUnlocked((u) => ({ ...u, [active.id]: true }));
                setActive((prev) => (prev ? { ...prev, lock_hash: hasLock ? "set" : null, lock_hint: hint } : prev));
                load();
              }}
            />

            {!isLocked(active) && (
              <>
                {!active.content.trim() && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      Start from a template
                    </p>
                    <TemplatePicker
                      onPick={(t) =>
                        setActive((prev) =>
                          prev
                            ? {
                                ...prev,
                                template: t.key,
                                title: prev.title && prev.title !== "New page" ? prev.title : t.title,
                                content: t.html,
                              }
                            : prev,
                        )
                      }
                    />
                  </div>
                )}
                {findTemplate(active.template) && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Template: {findTemplate(active.template)!.label}
                  </p>
                )}
                <Suspense
                  fallback={<div className="mt-4 h-[380px] animate-pulse rounded-2xl bg-muted/40" aria-hidden />}
                >
                  <RichTextEditor
                    key={`${active.id}:${active.template ?? ""}:${unlocked[active.id] ? "u" : "l"}`}
                    entryId={active.id}
                    value={active.content}
                    lastEdited={active.updated_at}
                    onChange={(html) => setActive((prev) => (prev ? { ...prev, content: html } : prev))}
                  />
                </Suspense>
                <PhotoGallery entryId={active.id} />
              </>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving || isLocked(active)}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
                className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete entry
              </button>
            </div>
          </section>
        ) : (
          <section className="glass-card grid place-items-center p-16 text-center">
            <div>
              <h3 className="font-display text-2xl">Your notebook is quiet.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Turn the page — a new entry awaits.</p>
              <button
                onClick={create}
                className="mt-5 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground shadow-glow"
              >
                Write first entry
              </button>
            </div>
          </section>
        )}
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this diary entry?</AlertDialogTitle>
            <AlertDialogDescription>
              “{active?.title || "Untitled"}” and its attached photos will be permanently removed. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep entry</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
