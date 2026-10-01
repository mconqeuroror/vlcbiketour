import { NextResponse } from "next/server";
import { handleContactRequest } from "@/lib/booking/server";

export async function POST(req: Request) {
  try {
    const result = await handleContactRequest(req);
    return NextResponse.json(result.body, {
      status: result.status,
      headers: result.headers,
    });
  } catch (err) {
    console.error("[booking] Unexpected error while processing contact message:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json(
    { ok: false },
    { status: 405, headers: { Allow: "POST" } },
  );
}
