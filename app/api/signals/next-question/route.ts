import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_QUESTIONS = 6;

const SYSTEM_PROMPT = `You are Signal, an AI conducting a short, personalised feedback conversation with a prospect about a stalled deal. You ask ONE question at a time. Based on their answer, you decide the next question or conclude.

Rules:
- Be HIGHLY personal - reference what they just said and the deal context
- Use tap-to-select options only (no open text) unless you truly need it
- Max 6 questions total. Keep it short and snappy
- Goal: give the AE intel on whether to re-engage, how, and when
- If you have enough intel, set is_complete: true
- One option should always let them indicate they're still interested

Return JSON:
- next_question: { question_text, options } or null if done
- is_complete: boolean
- open_field_prompt: (only if is_complete) short prompt for optional final comment`;

export async function POST(req: Request) {
  try {
    const { slug, answers } = await req.json();

    if (!slug || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Missing slug or answers" },
        { status: 400 }
      );
    }

    if (answers.length >= MAX_QUESTIONS) {
      return NextResponse.json({
        next_question: null,
        is_complete: true,
        open_field_prompt: "Anything else you'd like to add?",
      });
    }

    const admin = createAdminClient();

    const { data: signal, error: signalError } = await admin
      .from("signals")
      .select(`
        id,
        prospect_first_name,
        prospect_company,
        what_was_pitched,
        deal_stage_when_stalled,
        rep_hypothesis,
        speaking_duration,
        last_contact_ago,
        what_rep_wants_to_learn,
        generated_page_content
      `)
      .eq("unique_slug", slug)
      .single();

    if (signalError || !signal) {
      return NextResponse.json(
        { error: "Signal not found" },
        { status: 404 }
      );
    }

    const content = signal.generated_page_content as {
      intro_paragraph?: string;
      first_question?: { question_text: string; options: string[] };
      open_field_prompt?: string;
    } | null;

    const userPrompt = `
Deal context:
- Prospect: ${signal.prospect_first_name} at ${signal.prospect_company}
- Deal summary: ${signal.what_was_pitched}
- Stalled at: ${signal.deal_stage_when_stalled}
${signal.rep_hypothesis ? `- Rep's hypothesis: ${signal.rep_hypothesis}` : ""}
${signal.speaking_duration ? `- Speaking duration: ${signal.speaking_duration}` : ""}
${signal.last_contact_ago ? `- Last contact: ${signal.last_contact_ago}` : ""}
${signal.what_rep_wants_to_learn ? `- What rep wants to learn: ${JSON.stringify(signal.what_rep_wants_to_learn)}` : ""}

Prospect's answers so far (${answers.length}):
${answers.map((a: { question: string; answer: string }) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n")}

Generate the next question. Be personal and intelligent. Reference what they said. Max ${MAX_QUESTIONS - answers.length} more questions.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const contentStr = completion.choices[0]?.message?.content;
    if (!contentStr) {
      throw new Error("No content from OpenAI");
    }

    const result = JSON.parse(contentStr) as {
      next_question: { question_text: string; options: string[] } | null;
      is_complete: boolean;
      open_field_prompt?: string;
    };

    return NextResponse.json({
      next_question: result.next_question,
      is_complete: result.is_complete ?? !result.next_question,
      open_field_prompt:
        result.open_field_prompt ||
        content?.open_field_prompt ||
        "Anything else you'd like to add?",
    });
  } catch (err) {
    console.error("Next question error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to get next question",
      },
      { status: 500 }
    );
  }
}
