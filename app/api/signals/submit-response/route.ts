import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUMMARY_PROMPT = `You are Signal's analysis engine. A prospect has responded to a personalised feedback page about a stalled deal. Your job is to interpret their responses and give the sales rep a clear, actionable summary.

You will receive:
- The original deal context (what was pitched, where it stalled, rep's hypothesis)
- The prospect's answers to the personalised questions

Generate:

1. summary: 2-3 sentences explaining what the prospect's responses reveal about why the deal stalled.
2. recommendation: Exactly one of: "re_engage", "pivot_approach", "move_on", "revisit_later"
3. reasoning: 1-2 sentences explaining why you chose that recommendation.
4. suggested_next_step: One specific, actionable thing the rep should do next.

Be direct and honest. If the deal is dead, say so. If there's an opening, identify it specifically.

Return ONLY valid JSON with these four keys. No markdown, no preamble.`;

export async function POST(req: Request) {
  try {
    const { signalId, answers, answersObj } = await req.json();

    if (!signalId || (!answers && !answersObj?.opted_out)) {
      return NextResponse.json(
        { error: "Missing signalId or answers" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const optedOut = answersObj?.opted_out === true;

    const { data: signal, error: signalError } = await admin
      .from("signals")
      .select(`
        id,
        prospect_first_name,
        prospect_company,
        what_was_pitched,
        deal_stage_when_stalled,
        rep_hypothesis,
        generated_page_content
      `)
      .eq("id", signalId)
      .single();

    if (signalError || !signal) {
      return NextResponse.json(
        { error: "Signal not found" },
        { status: 404 }
      );
    }

    const { data: openedEvent } = await admin
      .from("signal_events")
      .select("timestamp")
      .eq("signal_id", signalId)
      .eq("event_type", "page_opened")
      .order("timestamp", { ascending: true })
      .limit(1)
      .single();

    const openedAt = openedEvent?.timestamp || new Date().toISOString();

    if (optedOut) {
      const { error: insertError } = await admin.from("responses").insert({
        signal_id: signalId,
        answers: [{ question: "Opted out", answer: "Not interested right now" }],
        ai_summary: "Prospect opted out - not interested at this time.",
        ai_recommendation: "move_on",
        opened_at: openedAt,
        completed_at: new Date().toISOString(),
        device_type: "unknown",
      });
      if (!insertError) {
        await admin.from("signal_events").insert({ signal_id: signalId, event_type: "page_completed" });
        await admin.from("signals").update({ status: "completed" }).eq("id", signalId);
      }
      return NextResponse.json({ ok: true });
    }

    const contextPrompt = `
Deal context:
- Prospect: ${signal.prospect_first_name} at ${signal.prospect_company}
- What was pitched: ${signal.what_was_pitched}
- Where it stalled: ${signal.deal_stage_when_stalled}
${signal.rep_hypothesis ? `- Rep's hypothesis: ${signal.rep_hypothesis}` : ""}

Prospect's answers:
${typeof answers === "object"
  ? JSON.stringify(answers, null, 2)
  : answers}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: contextPrompt },
      ],
      temperature: 0.35,
      response_format: { type: "json_object" },
    });

    const contentStr = completion.choices[0]?.message?.content;
    if (!contentStr) {
      throw new Error("No content from OpenAI");
    }

    const analysis = JSON.parse(contentStr) as {
      summary: string;
      recommendation: string;
      reasoning: string;
      suggested_next_step: string;
    };

    const { error: insertError } = await admin.from("responses").insert({
      signal_id: signalId,
      answers: Array.isArray(answers) ? answers : answersObj || answers,
      ai_summary: analysis.summary,
      ai_recommendation: analysis.recommendation,
      opened_at: openedAt,
      completed_at: new Date().toISOString(),
      device_type: "unknown",
    });

    if (insertError) {
      console.error("Insert response error:", insertError);
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
    }

    await admin.from("signal_events").insert({
      signal_id: signalId,
      event_type: "page_completed",
    });

    await admin
      .from("signals")
      .update({ status: "completed" })
      .eq("id", signalId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Submit response error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Submission failed",
      },
      { status: 500 }
    );
  }
}
