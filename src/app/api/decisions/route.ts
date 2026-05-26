import { NextResponse } from "next/server";
import { buildTimelineModel } from "@synthesis/timeline";

export const runtime = "nodejs";

export async function GET() {
  try {
    const entries = await buildTimelineModel();
    return NextResponse.json({ entries, source: "live" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, entries: [] }, { status: 500 });
  }
}
