import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId || !/^cs_(test_|live_)?[a-zA-Z0-9_]{15,}$/.test(sessionId)) return NextResponse.json({ status: "unknown" }, { status: 400 });
  try {
    const booking = await prisma.bookingRequest.findUnique({ where: { stripeSessionId: sessionId }, select: { status: true, paidAt: true } });
    return NextResponse.json({ status: booking?.paidAt ? booking.status : booking?.status === "expired" ? "expired" : "pending" }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ status: "unavailable" }, { status: 503 }); }
}
