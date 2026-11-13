import { useState } from "react";
import { X, Tag as TagIcon } from "lucide-react";

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
};

const clean = (t: string) => t.trim().replace(/^#/, "").slice(0, 24);

export function TagEditor({ tags, onChange, suggestions = [] }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const t = clean(raw);
    if (!t || tags.includes(t) || tags.length >= 12) return;
    onChange([...tags, t]);
    setDraft("");
  };

  const unused = suggestions.filter((s) => !tags.includes(s)).slice(0, 8);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <TagIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-foreground"
          >
            #{t}
            <button
              type="button"
              aria-label={`Remove tag ${t}`}
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          placeholder="Add a tag…"
          aria-label="Add a tag"
          maxLength={24}
          className="min-w-24 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
        />
      </div>
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
            >
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}