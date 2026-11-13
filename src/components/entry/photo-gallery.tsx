import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compress";

type Media = { id: string; storage_path: string; caption: string | null };

const MAX_FILE_MB = 15;

/** Drag-and-drop photo attachments stored in a private bucket and shown via signed URLs. */
export function PhotoGallery({ entryId }: { entryId: string }) {
  const [items, setItems] = useState<Media[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("entry_media")
      .select("id,storage_path,caption")
      .eq("entry_id", entryId)
      .order("position", { ascending: true });
    const list = (data as Media[]) ?? [];
    setItems(list);
    if (list.length) {
      const { data: signed } = await supabase.storage
        .from("entry-media")
        .createSignedUrls(list.map((m) => m.storage_path), 3600);
      const map: Record<string, string> = {};
      signed?.forEach((s) => {
        if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
      });
      setUrls(map);
    } else {
      setUrls({});
    }
  }, [entryId]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (files: FileList | File[]) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          toast.error(`${file.name} is larger than ${MAX_FILE_MB}MB`);
          continue;
        }
        const blob = await compressImage(file);
        const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
        const path = `${u.user.id}/${entryId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("entry-media")
          .upload(path, blob, { contentType: blob.type, upsert: false });
        if (error) {
          toast.error(error.message);
          continue;
        }
        const { error: rowErr } = await supabase
          .from("entry_media")
          .insert({ entry_id: entryId, user_id: u.user.id, storage_path: path, position: items.length });
        if (rowErr) toast.error(rowErr.message);
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: Media) => {
    await supabase.storage.from("entry-media").remove([m.storage_path]);
    const { error } = await supabase.from("entry_media").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <section className="mt-4" aria-label="Photos">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        className={`rounded-2xl border border-dashed p-4 transition ${
          dragging ? "border-primary bg-primary/10" : "border-border/60 bg-card/40"
        }`}
      >
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <span>Drop photos here, or click to choose</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && upload(e.target.files)}
          />
        </label>

        {items.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {items.map((m) => (
              <figure key={m.id} className="group relative overflow-hidden rounded-xl border border-border/50">
                {urls[m.storage_path] ? (
                  <img
                    src={urls[m.storage_path]}
                    alt={m.caption ?? "Journal photo"}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="aspect-square w-full animate-pulse bg-muted/50" />
                )}
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => remove(m)}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}