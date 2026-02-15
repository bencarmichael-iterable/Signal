"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewSignalPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "preview" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    prospect_first_name: "",
    prospect_company: "",
    what_was_pitched: "",
    deal_stage_when_stalled: "went_dark",
    rep_hypothesis: "",
    specific_context: "",
  });
  const [generated, setGenerated] = useState<{
    intro_paragraph: string;
    questions: { question_text: string; options: string[] }[];
    open_field_prompt: string;
    suggested_email: string;
  } | null>(null);
  const [signalId, setSignalId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

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
              What you pitched *
            </label>
            <textarea
              required
              rows={3}
              value={formData.what_was_pitched}
              onChange={(e) =>
                setFormData((p) => ({ ...p, what_was_pitched: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Our sales intelligence platform that helps teams close more deals..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Where did it stall? *
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anything specific you discussed? (optional)
            </label>
            <textarea
              rows={2}
              value={formData.specific_context}
              onChange={(e) =>
                setFormData((p) => ({ ...p, specific_context: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Pain points, quotes, topics from the conversation..."
            />
          </div>
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
