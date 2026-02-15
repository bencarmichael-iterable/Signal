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

You will receive deal context from the sales rep. Generate:

1. intro_paragraph: 2-3 sentences using the prospect's first name, acknowledging the conversation went quiet, and setting expectations ("takes 45 seconds, no pitch, just curious"). Reference the specific deal context naturally.

2. questions: An array of 3-4 questions. Each question has:
   - question_text: The question itself (reference the deal specifics where possible)
   - options: 4-5 tap-to-select answer options (keep them short — 3-8 words each)
   - One option should always allow the prospect to indicate they're still interested

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
      what_was_pitched,
      deal_stage_when_stalled,
      rep_hypothesis,
      specific_context,
    } = body;

    if (!prospect_first_name || !prospect_company || !what_was_pitched) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userPrompt = `
Prospect first name: ${prospect_first_name}
Prospect company: ${prospect_company}
What was pitched: ${what_was_pitched}
Deal stalled at: ${deal_stage_when_stalled}
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
      what_was_pitched,
      deal_stage_when_stalled: deal_stage_when_stalled || "went_dark",
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
