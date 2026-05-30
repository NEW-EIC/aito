/**
 * POST /api/admin/upload/image
 *
 * Receives a single image as multipart/form-data (field name: "file"),
 * validates MIME + size, uploads to Vercel Blob, returns the public URL.
 * Used by the TipTap editor's drag-drop / paste-image / toolbar-upload
 * flows.
 *
 * Why a server route instead of client-direct-to-Blob: keeps the Blob
 * token server-side, lets us enforce per-action permissions before any
 * bytes hit our quota, and writes an audit row for every upload.
 */

import { type NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requirePermission, StaffAuthError } from "@/lib/auth/staff";
import { recordAuditLog } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Allowed MIME types. WebP + AVIF future-proof; gif kept for short
 *  animated charts editors sometimes drop in. */
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/** 8 MB hard cap. Editorial-grade JPEGs/PNGs sit comfortably under 2 MB;
 *  8 MB leaves room for the occasional 4K screenshot without inviting
 *  10 MB stock-photo dumps. Larger uploads should pre-compress. */
const MAX_BYTES = 8 * 1024 * 1024;

type Result =
  | { ok: true; url: string; pathname: string; contentType: string; size: number }
  | {
      ok: false;
      code:
        | "noFile"
        | "tooLarge"
        | "unsupportedType"
        | "permissionDenied"
        | "notStaff"
        | "uploadFailed";
      message?: string;
    };

export async function POST(req: NextRequest): Promise<NextResponse<Result>> {
  // Permission first — kicks back StaffAuthError. media.upload exists in
  // the seeded permissions (see packages/database/prisma/seed.ts).
  let actorId: string;
  try {
    const ctx = await requirePermission("media.upload");
    actorId = ctx.userId;
  } catch (err) {
    if (err instanceof StaffAuthError) {
      return NextResponse.json(
        {
          ok: false,
          code: err.code === "not_staff" ? "notStaff" : "permissionDenied",
          message: err.message,
        },
        { status: err.code === "not_staff" ? 401 : 403 },
      );
    }
    throw err;
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, code: "noFile", message: "expected multipart/form-data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, code: "noFile" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, code: "tooLarge", message: `>${MAX_BYTES} bytes` },
      { status: 413 },
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { ok: false, code: "unsupportedType", message: `got ${file.type}` },
      { status: 415 },
    );
  }

  // Build a stable, non-guessable path. UUID prefix avoids collisions
  // when two editors upload "screenshot.png" within the same second.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "bin";
  const id = crypto.randomUUID();
  const pathname = `articles/${id}.${safeExt}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      // `addRandomSuffix: false` because we already prefix with a UUID;
      // the suffix would only add noise. (`true` is the SDK default.)
      addRandomSuffix: false,
    });

    await recordAuditLog({
      action: "article.created", // closest existing audit key; Day 9 audit-vocab
      actorId,                    // cleanup will add `media.uploaded` properly.
      resourceType: "media",
      resourceId: blob.pathname,
      newValue: {
        url: blob.url,
        contentType: file.type,
        size: file.size,
        originalName: file.name.slice(0, 200),
      },
      metadata: { source: "uploadImageRoute" },
    });

    return NextResponse.json({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    });
  } catch (err) {
    console.error("[upload-image] put failed", err);
    return NextResponse.json(
      {
        ok: false,
        code: "uploadFailed",
        message: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      },
      { status: 502 },
    );
  }
}
