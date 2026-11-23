"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Trash2, Upload } from "lucide-react";
import { deleteMedia, updateMediaAlt, uploadMedia, type MediaItem } from "@/lib/actions/admin";
import { MediaThumb } from "@/components/admin/MediaField";
import { ConfirmButton, Spinner, useAction, useToast } from "@/components/admin/ui";
import { formatBytes } from "@/lib/utils";

type Item = MediaItem & { provider: string };

export function MediaLibrary({ items, filtered }: { items: Item[]; filtered: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const form = new FormData();
    for (const file of files) form.append("files", file);
    setUploading(true);
    const result = await uploadMedia(form).catch(() => ({ ok: false as const, error: "Upload failed. Files may be too large." }));
    setUploading(false);
    if (result.ok) {
      toast("success", result.message ?? "Uploaded.");
      router.refresh();
    } else toast("error", result.error);
  }

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files); }}
        className={`mb-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center text-sm transition ${dragging ? "border-[#0f1524] bg-white" : "border-gray-300 text-gray-600"}`}
      >
        {uploading ? <Spinner /> : <Upload className="size-6" aria-hidden />}
        <p className="mt-2">{uploading ? "Uploading…" : "Drag files here, or"}</p>
        <button type="button" className="a-btn a-btn-primary mt-3" disabled={uploading} onClick={() => input.current?.click()}>Choose files</button>
        <input ref={input} type="file" multiple className="sr-only" aria-label="Upload files" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/x-icon,application/pdf" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
      </div>

      {items.length === 0 ? (
        <div className="a-card p-12 text-center text-sm text-gray-500">{filtered ? "No files match these filters." : "No files uploaded yet."}</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => <MediaCard key={item.id} item={item} />)}
        </ul>
      )}
    </>
  );
}

function MediaCard({ item }: { item: Item }) {
  const [alt, setAlt] = useState(item.alt);
  const [copied, setCopied] = useState(false);
  const { pending, run } = useAction();
  const isImage = item.mime.startsWith("image/");
  return (
    <li className="a-card overflow-hidden">
      <a href={item.url} target="_blank" rel="noreferrer" className="block aspect-[4/3] bg-[#f3f4f8] p-2"><MediaThumb item={item} /></a>
      <div className="space-y-2 p-3">
        <p className="truncate text-xs font-medium" title={item.filename}>{item.filename}</p>
        <p className="text-[11px] text-gray-500">
          {item.width && item.height ? `${item.width}×${item.height} · ` : ""}{item.size ? formatBytes(item.size) : item.provider === "seed" ? "Demo asset" : ""}
        </p>
        {isImage && (
          <div className="flex gap-1.5">
            <input aria-label={`Alt text for ${item.filename}`} className="a-input px-2 py-1.5 text-xs" placeholder="Alt text (describe the image)" maxLength={300} value={alt} onChange={(e) => setAlt(e.target.value)} />
            <button type="button" className="a-btn a-btn-icon" aria-label="Save alt text" disabled={pending || alt === item.alt} onClick={() => run(() => updateMediaAlt(item.id, alt))}>
              {pending ? <Spinner /> : <Check className="size-4" aria-hidden />}
            </button>
          </div>
        )}
        <div className="flex gap-1.5">
          <button
            type="button"
            className="a-btn flex-1"
            onClick={async () => {
              await navigator.clipboard.writeText(new URL(item.url, window.location.origin).toString()).catch(() => undefined);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy className="size-3.5" aria-hidden />
            {copied ? "Copied" : "Copy URL"}
          </button>
          <ConfirmButton action={deleteMedia.bind(null, item.id)} className="a-btn a-btn-icon a-btn-danger" label="Delete file" title={`Delete ${item.filename}?`} description="Anywhere this file is used will fall back to a placeholder.">
            <Trash2 className="size-4" aria-hidden />
          </ConfirmButton>
        </div>
      </div>
    </li>
  );
}
