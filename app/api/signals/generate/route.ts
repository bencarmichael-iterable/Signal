import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { nanoid } from "nanoid";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are Signal, an AI that helps sales professionals understand why their prospects went quiet. Your job is to generate a personalised micro-page that a prospect will receive via a unique link.

The tone must be:
- Warm, human, and disarming
- Zero sales pressure
- Genuinely curious, not manipulative
- Brief — respect the prospect's time

You will receive deal context from the sales rep, including what they want to learn (e.g. did they choose a competitor, reason for delay, is it still active, why did we lose). Tailor your questions to surface these answers. Generate:

1. intro_paragraph: 2-3 sentences using the prospect's first name, acknowledging the conversation went quiet, and setting expectations ("takes 45 seconds, no pitch, just curious"). Reference the specific deal context naturally.

2. questions: An array of 3-4 questions. Each question has:
   - question_text: The question itself (reference the deal specifics where possible)
   - options: 4-5 tap-to-select answer options (keep them short — 3-8 words each)
   - One option should always allow the prospect to indicate they're still interested
   - Prioritise questions that address what the rep wants to understand (competitor, delay reason, still active, why we lost)

3. open_field_prompt: A short, warm prompt for the optional open text field.

4. suggested_email: A 4-5 line email the rep can copy-paste. Written in first person as if the rep is typing it. Must feel human, not AI-generated. Include a placeholder for the Signal link: [SIGNAL_LINK]

Return ONLY valid JSON with these four keys. No markdown, no preamble.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      prospect_first_name,
      prospect_company,
      prospect_website_url,
      prospect_logo_url,
      what_was_pitched,
      deal_stage_when_stalled,
      speaking_duration,
      last_contact_ago,
      what_rep_wants_to_learn,
      rep_hypothesis,
      specific_context,
    } = body;

    if (!prospect_first_name || !prospect_company || !what_was_pitched || !prospect_website_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const WANTS_TO_LEARN_LABELS: Record<string, string> = {
      chose_competitor: "Did they choose a competitor?",
      reason_for_delay: "What's the reason for the delay?",
      still_active: "Is this still an active opportunity?",
      why_we_lost: "If not, why did we lose?",
      other: "Other (they'll explain in feedback)",
    };
    const wantsToLearnLabels =
      Array.isArray(what_rep_wants_to_learn) && what_rep_wants_to_learn.length > 0
        ? what_rep_wants_to_learn
            .map((v: string) => WANTS_TO_LEARN_LABELS[v] || v)
            .join(", ")
        : null;

    const SPEAKING_LABELS: Record<string, string> = {
      less_than_2_weeks: "Less than 2 weeks",
      "2_weeks_1_month": "2 weeks to 1 month",
      "1_3_months": "1–3 months",
      "3_6_months": "3–6 months",
      "6_plus_months": "6+ months",
      not_sure: "Not sure",
    };
    const LAST_CONTACT_LABELS: Record<string, string> = {
      "1_2_weeks": "1–2 weeks",
      "1_month": "1 month",
      "2_3_months": "2–3 months",
      "3_6_months": "3–6 months",
      "6_plus_months": "6+ months",
      not_sure: "Not sure",
    };

    const userPrompt = `
Prospect first name: ${prospect_first_name}
Prospect company: ${prospect_company}
Prospect website: ${prospect_website_url}
${prospect_logo_url ? `Prospect logo URL: ${prospect_logo_url}` : ""}
What was pitched (why rep's company is best for prospect): ${what_was_pitched}
Deal stalled at: ${deal_stage_when_stalled}
${speaking_duration ? `How long they had been speaking: ${SPEAKING_LABELS[speaking_duration] || speaking_duration}` : ""}
${last_contact_ago ? `How long ago last contact: ${LAST_CONTACT_LABELS[last_contact_ago] || last_contact_ago}` : ""}
${wantsToLearnLabels ? `What rep wants to understand: ${wantsToLearnLabels}` : ""}
${rep_hypothesis ? `Rep's hypothesis: ${rep_hypothesis}` : ""}
${specific_context ? `Specific context discussed: ${specific_context}` : ""}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.75,
      response_format: { type: "json_object" },
    });

    const contentStr = completion.choices[0]?.message?.content;
    if (!contentStr) {
      throw new Error("No content from OpenAI");
    }

    const content = JSON.parse(contentStr) as {
      intro_paragraph: string;
      questions: { question_text: string; options: string[] }[];
      open_field_prompt: string;
      suggested_email: string;
    };

    const slug = nanoid(10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const admin = createAdminClient();

    const { data: userProfile } = await admin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      await admin.from("users").insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        company_name: user.user_metadata?.company_name,
      });
    }

    const { data: signal, error } = await admin.from("signals").insert({
      user_id: user.id,
      prospect_first_name,
      prospect_company,
      prospect_website_url,
      prospect_logo_url: prospect_logo_url || null,
      what_was_pitched,
      deal_stage_when_stalled: deal_stage_when_stalled || "went_dark",
      speaking_duration: speaking_duration || null,
      last_contact_ago: last_contact_ago || null,
      what_rep_wants_to_learn:
        Array.isArray(what_rep_wants_to_learn) && what_rep_wants_to_learn.length > 0
          ? what_rep_wants_to_learn
          : null,
      rep_hypothesis: rep_hypothesis || null,
      specific_context: specific_context || null,
      generated_page_content: content,
      unique_slug: slug,
      status: "created",
      expires_at: expiresAt.toISOString(),
    }).select("id").single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create signal", details: error.message },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://signal-project.netlify.app";
    const link = `${baseUrl}/s/${slug}`;

    return NextResponse.json({
      content,
      signalId: signal.id,
      link,
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}
