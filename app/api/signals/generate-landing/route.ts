import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prospect_company, prospect_first_name, field } = body;

    if (!prospect_company?.trim()) {
      return NextResponse.json(
        { error: "Prospect company is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: userProfile } = await admin
      .from("users")
      .select("id, account_id")
      .eq("id", user.id)
      .single();

    let accountContext = "";
    if (userProfile?.account_id) {
      const { data: account } = await admin
        .from("accounts")
        .select("name, product_description, differentiators")
        .eq("id", userProfile.account_id)
        .single();
      if (account) {
        accountContext = [
          account.name && `Company: ${account.name}`,
          account.product_description && `Product: ${account.product_description}`,
          account.differentiators && `Differentiators: ${account.differentiators}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
    }

    if (!accountContext.trim()) {
      return NextResponse.json(
        { error: "Account settings not configured. Add company profile (product description, differentiators) in Settings first." },
        { status: 400 }
      );
    }

    const isLandingIntro = field === "landing_intro";
    const systemPrompt = isLandingIntro
      ? `You are a B2B copywriter. Generate a compelling landing page intro (2-4 sentences) for a cold outreach page.
It should: introduce the company, explain why they're reaching out to this prospect, mention relevant customers or social proof, and feel warm and helpful (not salesy).
Use the account context provided. Address the prospect company by name.`
      : `You are a B2B copywriter. Generate a concise value proposition (1-2 sentences) for a cold outreach page.
It should: explain what makes the solution unique and why it matters for prospects like the target company.
Use the account context provided. Be specific, not generic.`;

    const userPrompt = `Account context:
${accountContext}

Prospect company: ${prospect_company}
${prospect_first_name ? `Prospect first name: ${prospect_first_name}` : ""}

Generate ${isLandingIntro ? "the landing page intro" : "the value proposition"}. Return JSON: { "text": "..." }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const contentStr = completion.choices[0]?.message?.content;
    if (!contentStr) {
      throw new Error("No content from OpenAI");
    }

    const parsed = JSON.parse(contentStr) as { text: string };
    const text = parsed?.text?.trim() || "";

    if (!text) {
      throw new Error("Empty response from AI");
    }

    return NextResponse.json(
      isLandingIntro ? { landing_intro: text } : { value_prop: text }
    );
  } catch (err) {
    console.error("Generate landing error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}
