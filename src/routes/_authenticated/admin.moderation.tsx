import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listEntries, flagEntry, deleteEntry } from "@/lib/admin.functions";
import { Flag, FlagOff, Trash2 } from "lucide-react";
import { htmlToPlainText } from "@/lib/editor-utils";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  component: ModerationPage,
});

type Kind = "diary" | "gratitude" | "mood";

function ModerationPage() {
  const [kind, setKind] = useState<Kind>("diary");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const fetchEntries = useServerFn(listEntries);
  const doFlag = useServerFn(flagEntry);
  const doDelete = useServerFn(deleteEntry);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin.entries", kind, onlyFlagged],
    queryFn: () => fetchEntries({ data: { kind, onlyFlagged } }),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin.entries", kind, onlyFlagged] });

  const flag = async (id: string, flagged: boolean) => {
    let reason: string | undefined;
    if (flagged) {
      reason = window.prompt("Reason for flag (visible to team):", "Violates community policy") ?? undefined;
      if (!reason) return;
    }
    try {
      await doFlag({ data: { kind, id, flagged, reason } });
      toast.success(flagged ? "Flagged" : "Unflagged");
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry permanently?")) return;
    try {
      await doDelete({ data: { kind, id } });
      toast.success("Deleted");
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["diary", "gratitude", "mood"] as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-full px-3 py-1.5 text-xs capitalize transition ${
              kind === k ? "bg-primary text-primary-foreground" : "bg-white/60 hover:bg-white"
            }`}
          >
            {k}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyFlagged}
            onChange={(e) => setOnlyFlagged(e.target.checked)}
          />
          Only flagged
        </label>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here — the community is behaving ✿</p>
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((e: any) => (
            <li
              key={e.id}
              className={`rounded-2xl border p-4 ${
                e.flagged ? "border-destructive/50 bg-destructive/5" : "border-border bg-white/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {e.author?.name ?? e.author?.email ?? e.user_id.slice(0, 8)}
                    </span>
                    <span>·</span>
                    <span>{new Date(e.created_at).toLocaleString()}</span>
                    {e.mood && <span className="rounded-full bg-muted px-2 py-0.5">{e.mood}</span>}
                    {e.category && (
                      <span className="rounded-full bg-muted px-2 py-0.5">{e.category}</span>
                    )}
                    {e.flagged && (
                      <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-destructive">
                        flagged: {e.flag_reason}
                      </span>
                    )}
                  </div>
                  {e.title && <div className="mt-1 font-display text-lg">{e.title}</div>}
                  <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm">
                    {htmlToPlainText(e.content ?? e.note ?? "—")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {e.flagged ? (
                    <button
                      onClick={() => flag(e.id, false)}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs"
                    >
                      <FlagOff className="h-3 w-3" /> Unflag
                    </button>
                  ) : (
                    <button
                      onClick={() => flag(e.id, true)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                    >
                      <Flag className="h-3 w-3" /> Flag
                    </button>
                  )}
                  <button
                    onClick={() => remove(e.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-destructive/50 px-3 py-1.5 text-xs text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
