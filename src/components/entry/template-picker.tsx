import { ENTRY_TEMPLATES, type EntryTemplate } from "@/lib/entry-templates";

/** Prefill-only template chooser — picking one never restricts what can be written. */
export function TemplatePicker({ onPick }: { onPick: (t: EntryTemplate) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ENTRY_TEMPLATES.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onPick(t)}
          className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs transition hover:border-primary hover:bg-primary/10"
        >
          <span aria-hidden className="mr-1">{t.emoji}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}