import { useState } from "react";
import { Lock, LockOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { removeEntryLock, setEntryLock, unlockEntry } from "@/lib/entry-lock.functions";

type Props = {
  entryId: string;
  hasLock: boolean;
  hint: string | null;
  unlocked: boolean;
  /** Called with the decrypted-from-server content once the PIN is verified. */
  onUnlocked: (content: string) => void;
  onLockChanged: (hasLock: boolean, hint: string | null) => void;
};

export function EntryLock({ entryId, hasLock, hint, unlocked, onUnlocked, onLockChanged }: Props) {
  const doUnlock = useServerFn(unlockEntry);
  const doSet = useServerFn(setEntryLock);
  const doRemove = useServerFn(removeEntryLock);

  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [current, setCurrent] = useState("");
  const [newHint, setNewHint] = useState(hint ?? "");

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (hasLock && !unlocked) {
    return (
      <section className="glass-card mt-4 grid place-items-center p-10 text-center" aria-label="Locked entry">
        <div className="w-full max-w-xs">
          <Lock className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-3 font-display text-xl">This page is locked</h3>
          {hint && <p className="mt-1 text-xs text-muted-foreground">Hint: {hint}</p>}
          <form
            className="mt-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const res = await doUnlock({ data: { entryId, secret } });
                setSecret("");
                onUnlocked(res.content);
                toast.success("Unlocked ✿");
              });
            }}
          >
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter PIN or password"
              aria-label="Entry PIN"
              className="input w-full"
            />
            <button
              type="submit"
              disabled={busy || !secret}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2 text-sm text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Unlock
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {hasLock ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
        {hasLock ? "Locked — manage PIN" : "Lock this page"}
      </button>

      {open && (
        <div className="mt-2 space-y-2 rounded-2xl border border-border/60 bg-card/60 p-3">
          {hasLock && (
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Current PIN"
              aria-label="Current PIN"
              className="input w-full"
            />
          )}
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={hasLock ? "New PIN (min 4 characters)" : "PIN or password (min 4 characters)"}
            aria-label="New PIN"
            className="input w-full"
          />
          <input
            value={newHint}
            onChange={(e) => setNewHint(e.target.value)}
            placeholder="Optional hint"
            aria-label="Lock hint"
            maxLength={120}
            className="input w-full"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || secret.length < 4}
              onClick={() =>
                run(async () => {
                  await doSet({
                    data: { entryId, secret, currentSecret: current || undefined, hint: newHint || undefined },
                  });
                  setSecret("");
                  setCurrent("");
                  onLockChanged(true, newHint || null);
                  setOpen(false);
                  toast.success(hasLock ? "PIN updated" : "Page locked 🔒");
                })
              }
              className="rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground disabled:opacity-60"
            >
              {hasLock ? "Change PIN" : "Set PIN"}
            </button>
            {hasLock && (
              <button
                type="button"
                disabled={busy || !current}
                onClick={() =>
                  run(async () => {
                    await doRemove({ data: { entryId, secret: current } });
                    setCurrent("");
                    onLockChanged(false, null);
                    setOpen(false);
                    toast.success("Lock removed");
                  })
                }
                className="rounded-full border border-border px-4 py-1.5 text-xs disabled:opacity-60"
              >
                Remove lock
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}