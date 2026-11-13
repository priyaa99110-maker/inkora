import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EMOJI_GROUPS, STICKERS } from "./editor-presets";

type Props = {
  onInsert: (value: string) => void;
};

/** Emoji + sticker picker. Dependency-free so it stays light and fully keyboard accessible. */
export function InsertPopover({ onInsert }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"emoji" | "sticker">("emoji");

  const pick = (value: string) => {
    onInsert(value);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="toolbar-btn" aria-label="Insert emoji or sticker" title="Emoji & stickers">
          😊
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="mb-2 flex gap-1" role="tablist">
          {(["emoji", "sticker"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-xs capitalize transition ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t === "emoji" ? "Emoji" : "Stickers"}
            </button>
          ))}
        </div>
        <div className="max-h-64 overflow-y-auto pr-1">
          {tab === "emoji"
            ? Object.entries(EMOJI_GROUPS).map(([group, list]) => (
                <div key={group} className="mb-3">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">{group}</p>
                  <div className="grid grid-cols-8 gap-1">
                    {list.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => pick(emoji)}
                        className="rounded-md p-1 text-lg transition hover:bg-accent/60"
                        aria-label={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            : (
              <div className="grid grid-cols-4 gap-2">
                {STICKERS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => pick(s.value)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-border/60 p-2 text-2xl transition hover:bg-accent/50"
                    aria-label={`Insert ${s.label} sticker`}
                  >
                    <span>{s.value}</span>
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}