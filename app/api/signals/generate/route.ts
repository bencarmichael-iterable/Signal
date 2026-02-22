import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { nanoid } from "nanoid";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPTS: Record<string, string> = {
  deal_stalled: `You are Signal, an AI that helps sales professionals understand why their prospects went quiet. Your job is to generate the FIRST question for a personalised micro-page. More questions will be asked dynamically based on the prospect's answers.

The tone must be: Warm, human, disarming, zero sales pressure, genuinely curious. Brief - respect the prospect's time.

Generate from deal context:
1. landing_h1: A warm, disarming headline question. MUST start with {{firstName}} so we can personalize (e.g. "{{firstName}}, have a quick moment to share what happened?" or "{{firstName}}, still interested in moving forward?"). One short question, no period.
2. deal_summary: 2-3 sentences summarising what has happened in this deal so far. Include: what was discussed/pitched, where things reached, and where they stalled. Write for the prospect so they recognise the context.
3. value_prop_bullets: Array of 2-4 bullet points. Key deal context or what the rep hopes to understand. Keep each bullet one short line. Example: ["We discussed [solution] and next steps", "Things went quiet after [stage]", "Just curious where things stand"].
4. intro_paragraph: 2-3 sentences using the prospect's first name, acknowledging the conversation went quiet, and setting expectations ("takes 45 seconds, no pitch, just curious").
5. first_question: { question_text, options (4-5), multi_select?: true }
6. open_field_prompt: Short, warm prompt for optional open text.
7. suggested_email: 4-6 lines, first person, include [SIGNAL_LINK]. Never use "survey". Explain value for prospect.

Return ONLY valid JSON: landing_h1, deal_summary, value_prop_bullets, intro_paragraph, first_question, open_field_prompt, suggested_email.`,

  mid_deal: `You are Signal, an AI helping sales reps check deal health mid-opportunity. Generate the FIRST question for a personalised micro-page. Questions will branch dynamically.

Focus on: competitors in the mix, where they're winning/losing, experience so far, features/pricing/support comparison. Tone: warm, curious, no pressure.

Generate:
1. landing_h1: A warm headline question. MUST start with {{firstName}} (e.g. "{{firstName}}, quick pulse check on our conversation?" or "{{firstName}}, how's the evaluation going?"). One short question, no period.
2. deal_summary: 2-3 sentences on the deal context - what's been discussed, current stage, who's involved.
3. value_prop_bullets: Array of 2-4 bullet points. Key deal context or what we're trying to understand. Each bullet one short line.
4. intro_paragraph: 2-3 sentences, prospect's first name, frame as a quick pulse check ("45 seconds").
5. first_question: { question_text, options (4-5), multi_select?: true } - discovery-style, competitor/experience focused.
6. open_field_prompt: Short prompt for optional comment.
7. suggested_email: 4-6 lines, [SIGNAL_LINK], no "survey" framing.

Return ONLY valid JSON: landing_h1, deal_summary, value_prop_bullets, intro_paragraph, first_question, open_field_prompt, suggested_email.`,

  prospecting: `You are Signal, an AI helping with cold prospecting. Generate the FIRST question for a personalised landing page. Discovery-style questions.

Focus on: current solution, pain points, contract expiry, budget timing. Tone: warm, helpful, introduce value prop. No "survey" language.

Generate:
1. landing_h1: A compelling headline question. MUST start with {{firstName}} (e.g. "{{firstName}}, in the market for Marketing Automation?" or "{{firstName}}, exploring customer engagement platforms?"). One short question, no period.
2. deal_summary: 2-3 sentences introducing the company and why they're reaching out. Use landing_intro and value_prop context.
3. value_prop_bullets: Array of 3-5 bullet points. Combine value proposition + key customers/social proof. Each bullet one short line. Example: ["Cross-channel engagement at scale", "Trusted by Netflix, Spotify, and 1000+ brands", "Personalization that drives revenue"].
4. intro_paragraph: 2-3 sentences, prospect's first name, introduce the rep/company, set expectations ("takes 45 seconds").
5. first_question: { question_text, options (4-5), multi_select?: true } - discovery (e.g. "What solution are you using today?", "Any pain points?").
6. open_field_prompt: Short prompt for optional comment.
7. suggested_email: 4-6 lines, [SIGNAL_LINK], no "survey".

Return ONLY valid JSON: landing_h1, deal_summary, value_prop_bullets, intro_paragraph, first_question, open_field_prompt, suggested_email.`,
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      signal_type = "deal_stalled",
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
      landing_intro,
      value_prop,
    } = body;

    const st = ["deal_stalled", "mid_deal", "prospecting"].includes(signal_type)
      ? signal_type
      : "deal_stalled";

    if (!prospect_first_name || !prospect_company || !prospect_website_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (
      (st === "deal_stalled" || st === "mid_deal") &&
      !what_was_pitched?.trim()
    ) {
      return NextResponse.json(
        { error: "Deal context is required" },
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

    const admin = createAdminClient();
    const { data: userProfile } = await admin
      .from("users")
      .select("id, account_id")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      const { data: defaultAccount } = await admin
        .from("accounts")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      await admin.from("users").insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        company_name: user.user_metadata?.company_name,
        account_id: defaultAccount?.id ?? null,
        role: "admin",
      });
    }

    let accountContext = "";
    let systemPrompt = PROMPTS[st] || PROMPTS.deal_stalled;

    if (userProfile?.account_id) {
      const { data: account } = await admin
        .from("accounts")
        .select("product_description, differentiators")
        .eq("id", userProfile.account_id)
        .single();
      if (account) {
        accountContext = [
          account.product_description && `Product: ${account.product_description}`,
          account.differentiators && `Differentiators: ${account.differentiators}`,
        ]
          .filter(Boolean)
          .join("\n");
      }

      const { data: promptRows } = await admin
        .from("account_prompts")
        .select("prompt_key, prompt_value")
        .eq("account_id", userProfile.account_id)
        .eq("signal_type", st);
      const override = promptRows?.find((p) => p.prompt_key === "system_override" && p.prompt_value?.trim());
      if (override?.prompt_value) {
        systemPrompt = override.prompt_value;
      }
      const themes = promptRows?.find((p) => p.prompt_key === "question_themes" && p.prompt_value?.trim());
      if (themes?.prompt_value) {
        systemPrompt += `\n\nQuestion themes to consider: ${themes.prompt_value}`;
      }
    }

    const userPrompt = `
Prospect first name: ${prospect_first_name}
Prospect company: ${prospect_company}
Prospect website: ${prospect_website_url}
${prospect_logo_url ? `Prospect logo URL: ${prospect_logo_url}` : ""}
${accountContext ? `\nAccount context:\n${accountContext}` : ""}
${st === "prospecting" ? `
Landing intro (company, value prop, customers): ${landing_intro || ""}
Value proposition: ${value_prop || ""}
Why reaching out: ${what_was_pitched || ""}
` : `
Deal context: ${what_was_pitched}
Deal stage: ${deal_stage_when_stalled || "went_dark"}
${speaking_duration ? `How long speaking: ${SPEAKING_LABELS[speaking_duration] || speaking_duration}` : ""}
${last_contact_ago ? `Last contact: ${LAST_CONTACT_LABELS[last_contact_ago] || last_contact_ago}` : ""}
${wantsToLearnLabels ? `What rep wants to understand: ${wantsToLearnLabels}` : ""}
${rep_hypothesis ? `Rep's hypothesis: ${rep_hypothesis}` : ""}
`}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.75,
      response_format: { type: "json_object" },
    });

    const contentStr = completion.choices[0]?.message?.content;
    if (!contentStr) {
      throw new Error("No content from OpenAI");
    }

    const parsed = JSON.parse(contentStr) as {
      deal_summary?: string;
      landing_h1?: string;
      value_prop_bullets?: string[];
      intro_paragraph: string;
      first_question: { question_text: string; options: string[] };
      open_field_prompt: string;
      suggested_email: string;
    };
    const content = {
      ...parsed,
      questions: [parsed.first_question],
      dynamic: true,
    };

    const slug = nanoid(10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: signal, error } = await admin.from("signals").insert({
      user_id: user.id,
      signal_type: st,
      prospect_first_name,
      prospect_company,
      prospect_website_url,
      prospect_logo_url: prospect_logo_url || null,
      what_was_pitched: what_was_pitched || landing_intro || value_prop || "",
      deal_stage_when_stalled: deal_stage_when_stalled || "went_dark",
      speaking_duration: speaking_duration || null,
      last_contact_ago: last_contact_ago || null,
      what_rep_wants_to_learn:
        Array.isArray(what_rep_wants_to_learn) && what_rep_wants_to_learn.length > 0
          ? what_rep_wants_to_learn
          : null,
      rep_hypothesis: rep_hypothesis || null,
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
