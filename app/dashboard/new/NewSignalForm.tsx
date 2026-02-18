"use client";

import { useState } from "react";
import Link from "next/link";

const DEAL_STAGES = [
  { value: "after_discovery", label: "After discovery call" },
  { value: "after_demo", label: "After demo" },
  { value: "after_proposal", label: "After proposal sent" },
  { value: "after_trial", label: "After trial" },
  { value: "chose_competitor", label: "They chose a competitor" },
  { value: "said_not_now", label: "They said 'not now'" },
  { value: "went_dark", label: "They just went dark" },
  { value: "other", label: "Other" },
];

const SPEAKING_DURATION = [
  { value: "less_than_2_weeks", label: "Less than 2 weeks" },
  { value: "2_weeks_1_month", label: "2 weeks – 1 month" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_plus_months", label: "6+ months" },
  { value: "not_sure", label: "Not sure" },
];

const LAST_CONTACT_AGO = [
  { value: "1_2_weeks", label: "1–2 weeks" },
  { value: "1_month", label: "1 month" },
  { value: "2_3_months", label: "2–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_plus_months", label: "6+ months" },
  { value: "not_sure", label: "Not sure" },
];

const WHAT_REP_WANTS_TO_LEARN = [
  { value: "chose_competitor", label: "Did they choose a competitor?" },
  { value: "reason_for_delay", label: "What's the reason for the delay?" },
  { value: "still_active", label: "Is this still an active opportunity?" },
  { value: "why_we_lost", label: "If not, why did we lose?" },
  { value: "other", label: "Other (they'll explain in feedback)" },
];

const SIGNAL_TYPES = [
  { value: "deal_stalled", label: "Deal stalled", description: "Prospect went quiet. Get intel on re-engagement." },
  { value: "mid_deal", label: "Mid-deal", description: "Check deal health. Competitors, win/loss, experience." },
  { value: "prospecting", label: "Prospecting", description: "Cold outreach. Discovery questions, company intro." },
] as const;

type FormData = {
  signal_type: string;
  prospect_first_name: string;
  prospect_company: string;
  prospect_website_url: string;
  prospect_logo_url: string;
  what_was_pitched: string;
  deal_stage_when_stalled: string;
  speaking_duration: string;
  last_contact_ago: string;
  what_rep_wants_to_learn: string[];
  rep_hypothesis: string;
  landing_intro?: string;
  value_prop?: string;
};

type Props = {
  initialSignalType?: string;
  defaultLandingIntro?: string;
  defaultValueProp?: string;
};

export default function NewSignalForm({ initialSignalType, defaultLandingIntro = "", defaultValueProp = "" }: Props) {
  const [step, setStep] = useState<"form" | "preview" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resolvedType = ["prospecting", "mid_deal", "deal_stalled"].includes(
    initialSignalType ?? ""
  )
    ? initialSignalType!
    : "deal_stalled";
  const [formData, setFormData] = useState<FormData>({
    signal_type: resolvedType,
    prospect_first_name: "",
    prospect_company: "",
    prospect_website_url: "",
    prospect_logo_url: "",
    what_was_pitched: "",
    deal_stage_when_stalled: "went_dark",
    speaking_duration: "",
    last_contact_ago: "",
    what_rep_wants_to_learn: [],
    rep_hypothesis: "",
    landing_intro: defaultLandingIntro,
    value_prop: defaultValueProp,
  });
  const [generated, setGenerated] = useState<{
    deal_summary?: string;
    intro_paragraph: string;
    questions: { question_text: string; options: string[] }[];
    open_field_prompt: string;
    suggested_email: string;
  } | null>(null);
  const [signalId, setSignalId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatingLanding, setGeneratingLanding] = useState<"intro" | "value_prop" | null>(null);

  const dealSummaryLabel = `Summarise the deal so far, including MEDDPICC, or any other findings you have. Outline why you feel your solution is the best fit for ${formData.prospect_company || "the prospect"}`;

  function toggleWantToLearn(value: string) {
    setFormData((p) => ({
      ...p,
      what_rep_wants_to_learn: p.what_rep_wants_to_learn.includes(value)
        ? p.what_rep_wants_to_learn.filter((v) => v !== value)
        : [...p.what_rep_wants_to_learn, value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/signals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate");
      }

      const data = await res.json();
      setGenerated(data.content);
      setSignalId(data.signalId);
      setLink(data.link);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!signalId) return;
    setLoading(true);
    try {
      await fetch(`/api/signals/${signalId}/finalize`, { method: "POST" });
      setStep("done");
    } catch {
      setError("Failed to finalize");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "form") {
    return (
      <div>
        <Link href="/dashboard" className="text-gray-600 hover:text-primary mb-6 inline-block">
          ← Back to Signals
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">
          Create a new Signal
        </h1>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {!initialSignalType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signal type
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {SIGNAL_TYPES.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, signal_type: value }))}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      formData.signal_type === value
                        ? "border-accent bg-accent/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-medium text-gray-900">{label}</span>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {initialSignalType && (
            <p className="text-sm text-gray-600">
              Creating a{" "}
              <span className="font-medium">
                {SIGNAL_TYPES.find((t) => t.value === formData.signal_type)?.label ?? formData.signal_type}
              </span>{" "}
              Signal.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prospect first name *
            </label>
            <input
              type="text"
              required
              value={formData.prospect_first_name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, prospect_first_name: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Alex"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prospect company *
            </label>
            <input
              type="text"
              required
              value={formData.prospect_company}
              onChange={(e) =>
                setFormData((p) => ({ ...p, prospect_company: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Acme Inc"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prospect website *
            </label>
            <input
              type="url"
              required
              value={formData.prospect_website_url}
              onChange={(e) =>
                setFormData((p) => ({ ...p, prospect_website_url: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="https://acme.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Their branding and logo will appear on the micro-page.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prospect logo URL (optional)
            </label>
            <input
              type="url"
              value={formData.prospect_logo_url}
              onChange={(e) =>
                setFormData((p) => ({ ...p, prospect_logo_url: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="https://acme.com/logo.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste a direct link to their logo image. If blank, we&apos;ll use their company name.
            </p>
          </div>
          {formData.signal_type === "prospecting" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Landing page intro (editable by you)
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setGeneratingLanding("intro");
                      try {
                        const res = await fetch("/api/signals/generate-landing", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            prospect_company: formData.prospect_company,
                            prospect_first_name: formData.prospect_first_name,
                            field: "landing_intro",
                          }),
                        });
                        const data = await res.json();
                        if (res.ok && data.landing_intro) {
                          setFormData((p) => ({ ...p, landing_intro: data.landing_intro }));
                        } else {
                          setError(data.error || "Failed to generate");
                        }
                      } catch {
                        setError("Failed to generate");
                      } finally {
                        setGeneratingLanding(null);
                      }
                    }}
                    disabled={generatingLanding !== null}
                    className="text-sm text-accent hover:text-accent/80 font-medium disabled:opacity-50"
                  >
                    {generatingLanding === "intro" ? "Generating…" : "Generate using AI"}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={formData.landing_intro}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, landing_intro: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="Introduce your company, value proposition, and customers you work with..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Value proposition
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setGeneratingLanding("value_prop");
                      try {
                        const res = await fetch("/api/signals/generate-landing", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            prospect_company: formData.prospect_company,
                            prospect_first_name: formData.prospect_first_name,
                            field: "value_prop",
                          }),
                        });
                        const data = await res.json();
                        if (res.ok && data.value_prop) {
                          setFormData((p) => ({ ...p, value_prop: data.value_prop }));
                        } else {
                          setError(data.error || "Failed to generate");
                        }
                      } catch {
                        setError("Failed to generate");
                      } finally {
                        setGeneratingLanding(null);
                      }
                    }}
                    disabled={generatingLanding !== null}
                    className="text-sm text-accent hover:text-accent/80 font-medium disabled:opacity-50"
                  >
                    {generatingLanding === "value_prop" ? "Generating…" : "Generate using AI"}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={formData.value_prop}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, value_prop: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="What makes your solution unique for prospects like them?"
                />
              </div>
            </>
          )}

          {(formData.signal_type === "deal_stalled" || formData.signal_type === "mid_deal") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.signal_type === "deal_stalled"
                  ? dealSummaryLabel
                  : "Deal context (what you've discussed, stage, competitors)"}{" "}
                *
              </label>
              <textarea
                required
                rows={5}
                value={formData.what_was_pitched}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, what_was_pitched: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder={
                  formData.signal_type === "mid_deal"
                    ? "Current stage, who you've spoken to, competitors in the mix..."
                    : "Metrics identified, economic buyer, decision criteria, champion, competition..."
                }
              />
            </div>
          )}

          {formData.signal_type === "deal_stalled" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Where has the opportunity stalled? *
              </label>
              <select
                value={formData.deal_stage_when_stalled}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    deal_stage_when_stalled: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.signal_type === "mid_deal" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current deal stage
              </label>
              <select
                value={formData.deal_stage_when_stalled}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    deal_stage_when_stalled: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(formData.signal_type === "deal_stalled" || formData.signal_type === "mid_deal") && (
            <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.signal_type === "deal_stalled"
                ? "How long had you been speaking before it stalled?"
                : "How long have you been speaking?"}
            </label>
            <select
              value={formData.speaking_duration}
              onChange={(e) =>
                setFormData((p) => ({ ...p, speaking_duration: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="">Select...</option>
              {SPEAKING_DURATION.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How long ago was the last contact?
            </label>
            <select
              value={formData.last_contact_ago}
              onChange={(e) =>
                setFormData((p) => ({ ...p, last_contact_ago: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="">Select...</option>
              {LAST_CONTACT_AGO.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to understand from them?
            </label>
            <div className="space-y-2">
              {WHAT_REP_WANTS_TO_LEARN.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.what_rep_wants_to_learn.includes(opt.value)}
                    onChange={() => toggleWantToLearn(opt.value)}
                    className="rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What do you think happened? (optional)
            </label>
            <textarea
              rows={2}
              value={formData.rep_hypothesis}
              onChange={(e) =>
                setFormData((p) => ({ ...p, rep_hypothesis: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Budget got cut, champion left, timing..."
            />
          </div>
            </>
          )}

          {formData.signal_type === "prospecting" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Why you&apos;re reaching out (optional)
              </label>
              <textarea
                rows={3}
                value={formData.what_was_pitched}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, what_was_pitched: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="Any context about the prospect or why you're targeting them..."
              />
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Signal"}
          </button>
        </form>
      </div>
    );
  }

  if (step === "preview" && generated) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Preview your Signal
        </h1>
        <div className="max-w-2xl space-y-8">
          {generated.deal_summary && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-medium text-gray-900 mb-2">Deal summary</h2>
              <p className="text-gray-600">{generated.deal_summary}</p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-2">Intro</h2>
            <p className="text-gray-600">{generated.intro_paragraph}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-4">Questions</h2>
            {generated.questions.map((q, i) => (
              <div key={i} className="mb-4">
                <p className="text-gray-700 mb-2">{q.question_text}</p>
                <ul className="list-disc list-inside text-gray-600 text-sm">
                  {q.options.map((opt, j) => (
                    <li key={j}>{opt}</li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-gray-500 text-sm mt-2">
              Open field: {generated.open_field_prompt}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-2">Suggested email</h2>
            <p className="text-gray-600 whitespace-pre-wrap text-sm">
              {generated.suggested_email.replace("[SIGNAL_LINK]", link)}
            </p>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(generated.suggested_email.replace("[SIGNAL_LINK]", link))
              }
              className="mt-3 text-sm text-accent hover:underline"
            >
              {copied ? "Copied!" : "Copy email"}
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Finalizing..." : "Get my link"}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Save as draft
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Your Signal is ready
        </h1>
        <div className="max-w-2xl space-y-6 bg-white rounded-xl border border-gray-200 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Share this link with your prospect
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={link}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-sm"
              />
              <button
                onClick={() => copyToClipboard(link)}
                className="px-4 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Paste the link into your email client and send it to your prospect.
            They&apos;ll have 45 seconds to give honest feedback.
          </p>
          {generated && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or copy this email
              </label>
              <div className="flex gap-2">
                <textarea
                  readOnly
                  value={generated.suggested_email.replace("[SIGNAL_LINK]", link)}
                  rows={6}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-sm"
                />
                <button
                  onClick={() =>
                    copyToClipboard(generated.suggested_email.replace("[SIGNAL_LINK]", link))
                  }
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
          <Link
            href="/dashboard"
            className="inline-block text-accent hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
