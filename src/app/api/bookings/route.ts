import { NextResponse } from "next/server";
import { handleBookingRequest } from "@/lib/booking/server";

export async function POST(req: Request) {
  try {
    const result = await handleBookingRequest(req);
    return NextResponse.json(result.body, {
      status: result.status,
      headers: result.headers,
    });
  } catch {
    console.error("[booking] Checkout request failed");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json(
    { ok: false },
    { status: 405, headers: { Allow: "POST" } },
  );
}
