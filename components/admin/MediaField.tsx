"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Search, Trash2, Upload, X } from "lucide-react";
import { fetchMedia, uploadMedia, type MediaItem } from "@/lib/actions/admin";
import { Spinner, useToast } from "@/components/admin/ui";

const isImage = (m: MediaItem) => m.mime.startsWith("image/");

export function MediaThumb({ item, className = "" }: { item: MediaItem; className?: string }) {
  return isImage(item) ? (
    // Plain <img>: admin thumbnails do not need the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.url} alt={item.alt || item.filename} loading="lazy" className={`size-full object-contain ${className}`} />
  ) : (
    <span className="flex size-full flex-col items-center justify-center gap-1 text-gray-500">
      <FileText className="size-6" aria-hidden />
      <span className="max-w-full truncate px-2 text-[11px]">{item.filename}</span>
    </span>
  );
}

/** Modal media library with search, paging and upload. */
export function MediaPicker({
  open, onClose, onPick, kind, multiple,
}: { open: boolean; onClose: () => void; onPick: (items: MediaItem[]) => void; kind: "image" | "file"; multiple?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaItem[]>([]);

  const load = useCallback(async (nextPage: number, query: string) => {
    setLoading(true);
    const result = await fetchMedia({ q: query, kind, page: nextPage });
    setLoading(false);
    if (!result.ok) return toast("error", result.error);
    setItems(result.data?.items ?? []);
    setTotal(result.data?.total ?? 0);
    setPage(nextPage);
  }, [kind, toast]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setSelected([]);
      void load(1, "");
    }
    if (!open && dialog.open) dialog.close();
  }, [open, load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const form = new FormData();
    for (const file of files) form.append("files", file);
    setUploading(true);
    const result = await uploadMedia(form);
    setUploading(false);
    if (!result.ok) return toast("error", result.error);
    toast("success", result.message ?? "Uploaded.");
    const fresh = (result.data ?? []).filter((m) => (kind === "image" ? isImage(m) : !isImage(m)));
    if (!multiple && fresh[0]) {
      onPick([fresh[0]]);
      return onClose();
    }
    setSelected((s) => [...s, ...fresh]);
    void load(1, q);
  }

  const toggle = (item: MediaItem) => {
    if (!multiple) {
      onPick([item]);
      return onClose();
    }
    setSelected((s) => (s.some((x) => x.id === item.id) ? s.filter((x) => x.id !== item.id) : [...s, item]));
  };

  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()} className="m-auto h-[min(86vh,720px)] w-[min(94vw,880px)] rounded-2xl p-0 backdrop:bg-black/40 open:animate-[rise_0.25s_ease]">
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#e6e8ef] p-4">
          <h2 className="mr-auto text-base font-semibold">{kind === "image" ? "Choose image" : "Choose file"}</h2>
          {/* Not a <form>: this dialog is rendered inside the page's form, and forms cannot nest. */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-gray-400" aria-hidden />
            <input
              className="a-input w-44 pl-8"
              placeholder="Search…"
              aria-label="Search media"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                void load(1, q);
              }}
            />
          </div>
          <label className="a-btn a-btn-primary cursor-pointer">
            {uploading ? <Spinner /> : <Upload className="size-4" aria-hidden />}
            Upload
            <input type="file" className="sr-only" multiple={multiple} disabled={uploading} accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/avif,image/gif,image/x-icon" : "application/pdf"} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
          </label>
          <button type="button" className="a-btn a-btn-icon" aria-label="Close" onClick={onClose}><X className="size-4" aria-hidden /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4" data-lenis-prevent>
          {loading ? (
            <div className="flex h-full items-center justify-center text-gray-500"><Spinner /></div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-500">
              <ImagePlus className="mb-3 size-8" aria-hidden />
              Nothing here yet. Upload a file to get started.
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((item) => {
                const active = selected.some((s) => s.id === item.id);
                return (
                  <li key={item.id}>
                    <button type="button" onClick={() => toggle(item)} aria-pressed={active} title={item.filename} className={`block aspect-square w-full overflow-hidden rounded-xl border-2 bg-[#f3f4f8] p-1.5 transition ${active ? "border-[#0f1524]" : "border-transparent hover:border-gray-300"}`}>
                      <MediaThumb item={item} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#e6e8ef] p-4 text-sm">
          <div className="flex items-center gap-2">
            <button type="button" className="a-btn" disabled={page <= 1 || loading} onClick={() => load(page - 1, q)}>Previous</button>
            <button type="button" className="a-btn" disabled={page * 24 >= total || loading} onClick={() => load(page + 1, q)}>Next</button>
            <span className="text-gray-500">{total} item{total === 1 ? "" : "s"}</span>
          </div>
          {multiple && (
            <button type="button" className="a-btn a-btn-primary" disabled={!selected.length} onClick={() => { onPick(selected); onClose(); }}>
              Add {selected.length || ""} selected
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

type FieldProps = {
  kind: "image" | "file";
  multiple?: boolean;
  value: string[];
  onChange: (ids: string[]) => void;
  known: Record<string, MediaItem>;
};

/** Form control storing media ids, with previews. Used for single images, files and galleries. */
export function MediaField({ kind, multiple, value, onChange, known }: FieldProps) {
  const [open, setOpen] = useState(false);
  const [cache, setCache] = useState(known);
  const items = value.map((id) => cache[id]).filter(Boolean);
  const move = (index: number, delta: number) => {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {items.map((item, index) => (
          <div key={item.id} className="group relative size-28 overflow-hidden rounded-xl border border-[#e6e8ef] bg-[#f3f4f8] p-1.5">
            <MediaThumb item={item} />
            <div className="absolute inset-x-1 bottom-1 flex justify-center gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
              {multiple && index > 0 && <button type="button" className="rounded-md bg-white px-1.5 text-xs shadow" aria-label="Move earlier" onClick={() => move(index, -1)}>←</button>}
              {multiple && index < items.length - 1 && <button type="button" className="rounded-md bg-white px-1.5 text-xs shadow" aria-label="Move later" onClick={() => move(index, 1)}>→</button>}
              <button type="button" className="rounded-md bg-white p-1 text-red-600 shadow" aria-label={`Remove ${item.filename}`} onClick={() => onChange(value.filter((id) => id !== item.id))}>
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ))}
        {(multiple || items.length === 0) && (
          <button type="button" onClick={() => setOpen(true)} className="flex size-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 text-xs text-gray-600 transition hover:border-[#0f1524] hover:text-[#0f1524]">
            {kind === "image" ? <ImagePlus className="size-5" aria-hidden /> : <FileText className="size-5" aria-hidden />}
            {multiple ? "Add images" : kind === "image" ? "Choose image" : "Choose file"}
          </button>
        )}
      </div>
      {!multiple && items.length > 0 && (
        <button type="button" className="mt-2 text-xs underline underline-offset-2" onClick={() => setOpen(true)}>Replace</button>
      )}
      <MediaPicker
        open={open}
        kind={kind}
        multiple={multiple}
        onClose={() => setOpen(false)}
        onPick={(picked) => {
          setCache((c) => ({ ...c, ...Object.fromEntries(picked.map((p) => [p.id, p])) }));
          onChange(multiple ? [...new Set([...value, ...picked.map((p) => p.id)])] : picked.slice(0, 1).map((p) => p.id));
        }}
      />
    </div>
  );
}
