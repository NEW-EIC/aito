import { NextResponse } from "next/server";
import { ensureCsrfCookie } from "@/lib/auth/csrf";

export async function GET() {
  const token = await ensureCsrfCookie();
  return NextResponse.json({ token });
}
