import { NextResponse } from "next/server";
import { __TEST_STORE } from "@/lib/auth/rateLimit";

export async function POST() {
  if (process.env.NODE_ENV === "production" || process.env.AITO_E2E !== "1") {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  __TEST_STORE.clear();
  return NextResponse.json({ ok: true });
}
