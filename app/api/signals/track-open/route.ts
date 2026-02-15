import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { signalId } = await req.json();

    if (!signalId) {
      return NextResponse.json(
        { error: "Missing signalId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("signal_events")
      .select("id")
      .eq("signal_id", signalId)
      .eq("event_type", "page_opened")
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ ok: true });
    }

    await admin.from("signal_events").insert({
      signal_id: signalId,
      event_type: "page_opened",
    });

    await admin
      .from("signals")
      .update({ status: "opened" })
      .eq("id", signalId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Track open error:", err);
    return NextResponse.json(
      { error: "Failed to track" },
      { status: 500 }
    );
  }
}
