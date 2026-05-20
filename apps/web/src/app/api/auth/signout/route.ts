import { NextResponse, type NextRequest } from "next/server";
import {
  clearSessionCookie,
  getSessionFromCookie,
  revokeSession,
} from "@/lib/auth/session";
import { recordAuthEvent } from "@/lib/auth/audit";
import { verifyCsrf } from "@/lib/auth/csrf";

export async function POST(req: NextRequest) {
  const csrf = await verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: csrf.status });
  }

  const current = await getSessionFromCookie();
  if (current) {
    await revokeSession(current.session.id);
    await recordAuthEvent({
      action: "user.signout",
      actorId: current.user.id,
      resourceType: "session",
      resourceId: current.session.id,
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
