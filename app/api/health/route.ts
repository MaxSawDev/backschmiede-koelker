import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = {
  "Cache-Control": "no-store, max-age=0",
};

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200, headers });
}

export function HEAD() {
  return new NextResponse(null, { status: 200, headers });
}
