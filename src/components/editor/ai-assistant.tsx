import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  EMOTIONAL_TONES,
  REWRITE_STYLES,
  rewriteJournalText,
} from "@/lib/ai-writing.functions";

type Props = {
  /** Current entry text, as plain text. */
  getText: () => string;
  /** Called only after the user explicitly confirms the suggestion. */
  onApply: (text: string) => void;
};

/** AI writing assistant. Never replaces the entry without an explicit confirmation. */
export function AiAssistant({ getText, onApply }: Props) {
  const rewrite = useServerFn(rewriteJournalText);
  const [loading, setLoading] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ label: string; text: string } | null>(null);

  const run = async (action: "autoformat" | "style" | "tone", option?: string) => {
    const text = getText().trim();
    if (!text) return toast.error("Write something first ✿");
    const label = option ?? "Auto format";
    setLoading(label);
    try {
      const res = await rewrite({ data: { text, action, option } });
      setSuggestion({ label, text: res.result });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The assistant could not respond.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-4" aria-label="AI writing assistant">
      <header className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg">Writing assistant</h3>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </header>

      <div className="space-y-3">
        <div>
          <button
            type="button"
            onClick={() => run("autoformat")}
            disabled={loading !== null}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-60"
          >
            Auto format &amp; polish
          </button>
        </div>

        <ChipRow
          title="Rewrite style"
          options={REWRITE_STYLES as readonly string[]}
          disabled={loading !== null}
          onPick={(o) => run("style", o)}
        />
        <ChipRow
          title="Emotional tone"
          options={EMOTIONAL_TONES as readonly string[]}
          disabled={loading !== null}
          onPick={(o) => run("tone", o)}
        />
      </div>

      {suggestion && (
        <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Suggestion — {suggestion.label}. Your original text is untouched until you apply it.
          </p>
          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-background/60 p-3 text-sm leading-6">
            {suggestion.text}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onApply(suggestion.text);
                setSuggestion(null);
                toast.success("Applied ✿");
              }}
              className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Check className="h-3.5 w-3.5" /> Apply
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-xs"
            >
              <X className="h-3.5 w-3.5" /> Discard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ChipRow({
  title,
  options,
  disabled,
  onPick,
}: {
  title: string;
  options: readonly string[];
  disabled: boolean;
  onPick: (option: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            disabled={disabled}
            onClick={() => onPick(o)}
            className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs transition hover:border-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}