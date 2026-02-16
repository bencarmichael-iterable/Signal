import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const RECOMMENDATION_LABELS: Record<string, string> = {
  re_engage: "Re-engage",
  pivot_approach: "Pivot approach",
  move_on: "Move on",
  revisit_later: "Revisit later",
};

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: signal, error } = await supabase
    .from("signals")
    .select(`
      id,
      prospect_first_name,
      prospect_company,
      what_was_pitched,
      deal_stage_when_stalled,
      rep_hypothesis,
      specific_context,
      generated_page_content,
      unique_slug,
      status,
      created_at,
      responses (
        answers,
        ai_summary,
        ai_recommendation,
        opened_at,
        completed_at
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !signal) {
    notFound();
  }

  const response = Array.isArray(signal.responses)
    ? signal.responses[0]
    : signal.responses;
  const content = signal.generated_page_content as {
    intro_paragraph: string;
    questions: { question_text: string; options: string[] }[];
    suggested_email: string;
  } | null;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://signal-project.netlify.app";
  const link = `${baseUrl}/s/${signal.unique_slug}`;

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-gray-600 hover:text-primary mb-6 inline-block"
      >
        ← Back to Signals
      </Link>

      <div className="max-w-2xl space-y-8">
        {response?.ai_summary && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-6">
            <h2 className="font-medium text-gray-900 mb-2">AI summary</h2>
            <p className="text-gray-700">{response.ai_summary}</p>
            {response.ai_recommendation && (
              <p className="mt-3">
                <span className="font-medium">Recommendation: </span>
                {RECOMMENDATION_LABELS[response.ai_recommendation] ||
                  response.ai_recommendation.replace(/_/g, " ")}
              </p>
            )}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {signal.prospect_first_name} @ {signal.prospect_company}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Created {new Date(signal.created_at).toLocaleDateString()} · Status:{" "}
            {signal.status}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-medium text-gray-900 mb-4">Deal context</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">What you pitched</dt>
              <dd className="text-gray-900">{signal.what_was_pitched}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Where it stalled</dt>
              <dd className="text-gray-900">
                {signal.deal_stage_when_stalled.replace(/_/g, " ")}
              </dd>
            </div>
            {signal.rep_hypothesis && (
              <div>
                <dt className="text-gray-500">Your hypothesis</dt>
                <dd className="text-gray-900">{signal.rep_hypothesis}</dd>
              </div>
            )}
            {signal.specific_context && (
              <div>
                <dt className="text-gray-500">Specific context</dt>
                <dd className="text-gray-900">{signal.specific_context}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-medium text-gray-900 mb-2">Share link</h2>
          <p className="text-sm text-gray-600 font-mono break-all">{link}</p>
        </div>

        {content && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-4">
              Generated micro-page preview
            </h2>
            <p className="text-gray-600 mb-4">{content.intro_paragraph}</p>
            <ul className="space-y-2">
              {content.questions.map((q, i) => (
                <li key={i} className="text-sm">
                  <span className="text-gray-700">{q.question_text}</span>
                  <span className="text-gray-500 ml-1">
                    ({q.options.join(", ")})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {response && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-medium text-gray-900 mb-4">
                Prospect&apos;s responses
              </h2>
              {typeof response.answers === "object" &&
              !Array.isArray(response.answers) ? (
                <dl className="space-y-2">
                  {Object.entries(response.answers).map(([k, v]) =>
                    v ? (
                      <div key={k}>
                        <dt className="text-gray-500 text-sm">{k}</dt>
                        <dd className="text-gray-900">{String(v)}</dd>
                      </div>
                    ) : null
                  )}
                </dl>
              ) : (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(response.answers, null, 2)}
                </pre>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}
