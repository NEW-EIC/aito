import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";

export async function GET() {
  if (process.env.NODE_ENV === "production" || process.env.AITO_E2E !== "1") {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const current = await getSessionFromCookie();
  return NextResponse.json({
    authenticated: !!current,
    userId: current?.user.id ?? null,
    email: current?.user.email ?? null,
  });
}
