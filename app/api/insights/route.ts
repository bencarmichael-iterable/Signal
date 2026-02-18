import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("team_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("account_id, team_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.account_id) {
    return NextResponse.json({
      insights: null,
      summary: null,
      recommendationDistribution: [],
      teams: [],
      funnel: { created: 0, sent: 0, opened: 0, completed: 0 },
      performanceByType: {},
    });
  }

  const { data: accountUsers } = await admin
    .from("users")
    .select("id, team_id")
    .eq("account_id", profile.account_id);

  const userIds = accountUsers?.map((u) => u.id) ?? [];
  const targetUserIds = teamId
    ? (accountUsers?.filter((u) => u.team_id === teamId).map((u) => u.id) ?? [])
    : userIds;
  const effectiveUserIds = targetUserIds.length > 0 ? targetUserIds : userIds;

  if (userIds.length === 0) {
    return NextResponse.json({
      insights: "",
      responseCount: 0,
      signalCount: 0,
      recommendationDistribution: [],
      teams: [],
      funnel: { created: 0, sent: 0, opened: 0, completed: 0 },
      performanceByType: {},
    });
  }

  // Funnel + performance by type
  let funnelQuery = admin
    .from("signals")
    .select("id, status, signal_type, created_at")
    .in("user_id", effectiveUserIds);
  if (startDate) funnelQuery = funnelQuery.gte("created_at", startDate);
  if (endDate) funnelQuery = funnelQuery.lte("created_at", endDate + "T23:59:59.999Z");
  const { data: allSignals } = await funnelQuery;

  const funnel = {
    created: allSignals?.length ?? 0,
    sent: allSignals?.filter((s) => ["sent", "opened", "completed"].includes(s.status)).length ?? 0,
    opened: allSignals?.filter((s) => ["opened", "completed"].includes(s.status)).length ?? 0,
    completed: allSignals?.filter((s) => s.status === "completed").length ?? 0,
  };

  const byType: Record<string, { created: number; completed: number }> = {};
  for (const s of allSignals ?? []) {
    const t = s.signal_type || "deal_stalled";
    if (!byType[t]) byType[t] = { created: 0, completed: 0 };
    byType[t].created++;
    if (s.status === "completed") byType[t].completed++;
  }

  let signalsQuery = admin
    .from("signals")
    .select(`
      id,
      signal_type,
      prospect_company,
      created_at,
      responses (
        ai_summary,
        ai_recommendation,
        answers
      )
    `)
    .in("user_id", effectiveUserIds)
    .in("status", ["opened", "completed"]);

  if (startDate) {
    signalsQuery = signalsQuery.gte("created_at", startDate);
  }
  if (endDate) {
    signalsQuery = signalsQuery.lte("created_at", endDate + "T23:59:59.999Z");
  }

  const { data: signals } = await signalsQuery;

  const responses = (signals ?? [])
    .flatMap((s) => {
      const r = s.responses;
      return Array.isArray(r) ? r : r ? [r] : [];
    })
    .filter((r) => r.ai_summary || r.ai_recommendation);

  const recommendationCounts: Record<string, number> = {};
  for (const r of responses) {
    const rec = r.ai_recommendation || "unknown";
    recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
  }

  const recommendationDistribution = Object.entries(recommendationCounts).map(
    ([key, count]) => ({
      recommendation: key.replace(/_/g, " "),
      count,
    })
  );

  const allSummaries = responses.map((r) => r.ai_summary).filter(Boolean).join("\n\n");
  const allAnswers = responses
    .flatMap((r) => {
      const a = r.answers;
      if (Array.isArray(a)) return a.map((x) => `${x.question}: ${x.answer}`).join("\n");
      if (typeof a === "object") return Object.entries(a).map(([k, v]) => `${k}: ${v}`).join("\n");
      return String(a);
    })
    .join("\n\n");

  let qualitativeInsights = "";
  if (responses.length >= 1 && allSummaries) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an analyst. Given aggregated prospect feedback from sales signals, produce a brief insights report (3-5 bullet points). Cover:
- Top reasons deals stall or go dark
- Common competitor mentions
- Win/loss themes
- What's working vs what's not
Be direct and actionable. Return plain text, no markdown.`,
          },
          {
            role: "user",
            content: `Aggregated AI summaries (${responses.length} responses):\n\n${allSummaries}\n\nSample answers:\n${allAnswers.slice(0, 3000)}`,
          },
        ],
        temperature: 0.4,
      });
      qualitativeInsights = completion.choices[0]?.message?.content?.trim() ?? "";
    } catch {
      qualitativeInsights = "Unable to generate insights.";
    }
  }

  const { data: teams } = await admin
    .from("teams")
    .select("id, name")
    .eq("account_id", profile.account_id);

  return NextResponse.json({
    insights: qualitativeInsights,
    responseCount: responses.length,
    signalCount: signals?.length ?? 0,
    recommendationDistribution,
    teams: teams ?? [],
    funnel,
    performanceByType: byType,
  });
}
