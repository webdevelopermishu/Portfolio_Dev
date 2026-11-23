import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadDir } from "@/lib/storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", avif: "image/avif",
  ico: "image/x-icon", pdf: "application/pdf",
};

/** Serves files written by the local storage driver. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  const root = uploadDir();
  const file = path.resolve(/*turbopackIgnore: true*/ root, ...segments);
  const type = TYPES[path.extname(file).slice(1).toLowerCase()];
  if (!file.startsWith(root + path.sep) || !type) return new NextResponse("Not found", { status: 404 });
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not a file");
    const data = await readFile(file);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        // Keys contain a random suffix, so files never change once written.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
