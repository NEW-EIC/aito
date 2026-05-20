import { headers } from "next/headers";

/** Best-effort client IP from common forwarding headers. */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip");
}

/** Best-effort locale recovery from the Referer path. Defaults to "en". */
export async function getLocaleFromReferer(): Promise<string> {
  const h = await headers();
  const ref = h.get("referer");
  if (!ref) return "en";
  try {
    const url = new URL(ref);
    const seg = url.pathname.split("/").filter(Boolean)[0];
    if (seg === "en" || seg === "zh-CN" || seg === "zh-HK") return seg;
  } catch {
    // ignore
  }
  return "en";
}
