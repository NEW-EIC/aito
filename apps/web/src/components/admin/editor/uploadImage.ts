"use client";

/**
 * Single source of truth for uploading an image from the editor. The
 * drag-and-drop handler, paste-image handler, and toolbar upload
 * button all funnel through here so error handling + audit trail
 * are consistent.
 */

export type UploadImageResult =
  | { ok: true; url: string; pathname: string; contentType: string; size: number }
  | {
      ok: false;
      code:
        | "noFile"
        | "tooLarge"
        | "unsupportedType"
        | "permissionDenied"
        | "notStaff"
        | "uploadFailed"
        | "networkError";
      message?: string;
    };

export async function uploadImageFile(file: File): Promise<UploadImageResult> {
  const form = new FormData();
  form.set("file", file);

  let res: Response;
  try {
    res = await fetch("/api/admin/upload/image", {
      method: "POST",
      body: form,
      credentials: "same-origin",
    });
  } catch (err) {
    return {
      ok: false,
      code: "networkError",
      message: err instanceof Error ? err.message : "network error",
    };
  }

  // The server already returns a typed JSON body for every status code.
  try {
    return (await res.json()) as UploadImageResult;
  } catch {
    return { ok: false, code: "uploadFailed", message: `non-JSON ${res.status}` };
  }
}
