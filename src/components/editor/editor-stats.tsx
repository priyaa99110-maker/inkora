import { memo } from "react";
import { formatDistanceToNow } from "date-fns";
import type { EditorStats } from "@/lib/editor-utils";

type Props = { stats: EditorStats; lastEdited?: string | null };

export const EditorStatsBar = memo(function EditorStatsBar({ stats, lastEdited }: Props) {
  const items = [
    { label: "words", value: stats.words },
    { label: "characters", value: stats.characters },
    { label: "paragraphs", value: stats.paragraphs },
    { label: "min read", value: stats.readingMinutes },
  ];
  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-border/50 bg-card/50 px-4 py-2 text-xs text-muted-foreground"
      aria-live="polite"
    >
      {items.map((i) => (
        <span key={i.label}>
          <strong className="font-semibold text-foreground">{i.value}</strong> {i.label}
        </span>
      ))}
      {lastEdited && (
        <span className="ml-auto">
          Last edited {formatDistanceToNow(new Date(lastEdited), { addSuffix: true })}
        </span>
      )}
    </div>
  );
});