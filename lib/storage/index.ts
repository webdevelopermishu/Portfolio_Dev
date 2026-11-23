import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredFile = { url: string; key: string; provider: string };

export interface StorageDriver {
  name: string;
  put(key: string, data: Buffer, mime: string): Promise<StoredFile>;
  remove(key: string): Promise<void>;
}

export function uploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "./storage/uploads");
}

/** Files are written outside /public and served by app/media/[...path]/route.ts. */
const localDriver: StorageDriver = {
  name: "local",
  async put(key, data) {
    const target = path.join(/*turbopackIgnore: true*/ uploadDir(), key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
    return { url: `/media/${key}`, key, provider: "local" };
  },
  async remove(key) {
    const root = uploadDir();
    const target = path.resolve(/*turbopackIgnore: true*/ root, key);
    if (!target.startsWith(root + path.sep)) return;
    await unlink(target).catch(() => undefined);
  },
};

/** Cloudinary via its signed REST API (no SDK dependency). */
const cloudinaryDriver: StorageDriver = {
  name: "cloudinary",
  async put(key, data, mime) {
    const { cloud, apiKey, apiSecret, folder } = cloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = key.replace(/\.[a-z0-9]+$/i, "");
    const params: Record<string, string> = { folder, public_id: publicId, timestamp };
    const signature = signCloudinary(params, apiSecret);
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(data)], { type: mime }), key);
    for (const [k, v] of Object.entries(params)) form.append(k, v);
    form.append("api_key", apiKey);
    form.append("signature", signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status})`);
    const json = (await res.json()) as { secure_url: string; public_id: string; resource_type: string };
    return { url: json.secure_url, key: `${json.resource_type}:${json.public_id}`, provider: "cloudinary" };
  },
  async remove(key) {
    const { cloud, apiKey, apiSecret } = cloudinaryConfig();
    const [resourceType, ...rest] = key.split(":");
    const publicId = rest.join(":");
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = { public_id: publicId, timestamp };
    const form = new FormData();
    form.append("public_id", publicId);
    form.append("timestamp", timestamp);
    form.append("api_key", apiKey);
    form.append("signature", signCloudinary(params, apiSecret));
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/destroy`, { method: "POST", body: form }).catch(
      () => undefined,
    );
  },
};

function cloudinaryConfig() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !apiSecret) {
    throw new Error("Cloudinary storage selected but CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET are not set");
  }
  return { cloud, apiKey, apiSecret, folder: process.env.CLOUDINARY_FOLDER || "portfolio" };
}

function signCloudinary(params: Record<string, string>, secret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
}

const drivers: Record<string, StorageDriver> = { local: localDriver, cloudinary: cloudinaryDriver };

export function storage(provider?: string): StorageDriver {
  return drivers[provider || process.env.STORAGE_DRIVER || "local"] ?? localDriver;
}

// ── Upload validation ───────────────────────────────────────────────────────

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type Kind = { mime: string; ext: string; test: (b: Buffer) => boolean };
const startsWith = (sig: number[], offset = 0) => (b: Buffer) => sig.every((byte, i) => b[offset + i] === byte);

/** Accepted types, verified by magic bytes rather than the browser-supplied MIME type. SVG is deliberately excluded. */
const KINDS: Kind[] = [
  { mime: "image/jpeg", ext: "jpg", test: startsWith([0xff, 0xd8, 0xff]) },
  { mime: "image/png", ext: "png", test: startsWith([0x89, 0x50, 0x4e, 0x47]) },
  { mime: "image/gif", ext: "gif", test: startsWith([0x47, 0x49, 0x46, 0x38]) },
  { mime: "image/webp", ext: "webp", test: (b) => startsWith([0x52, 0x49, 0x46, 0x46])(b) && startsWith([0x57, 0x45, 0x42, 0x50], 8)(b) },
  { mime: "image/avif", ext: "avif", test: (b) => b.subarray(4, 12).toString("latin1") === "ftypavif" },
  { mime: "image/x-icon", ext: "ico", test: startsWith([0x00, 0x00, 0x01, 0x00]) },
  { mime: "application/pdf", ext: "pdf", test: startsWith([0x25, 0x50, 0x44, 0x46]) },
];

export function detectFileType(data: Buffer) {
  return KINDS.find((k) => k.test(data)) ?? null;
}

export function newStorageKey(originalName: string, ext: string) {
  const base =
    originalName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "file";
  const now = new Date();
  return `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${base}-${randomBytes(5).toString("hex")}.${ext}`;
}
