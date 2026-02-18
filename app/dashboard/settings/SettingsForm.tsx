"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TeamsSection from "./TeamsSection";

const SIGNAL_TYPES = [
  { value: "deal_stalled", label: "Deal stalled" },
  { value: "mid_deal", label: "Mid-deal" },
  { value: "prospecting", label: "Prospecting" },
];

const PROMPT_KEYS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  deal_stalled: [
    { key: "system_override", label: "System prompt override", placeholder: "Optional. Override the default AI instructions for deal-stalled signals." },
    { key: "question_themes", label: "Question themes", placeholder: "e.g. competitor intel, timeline, budget, decision process" },
  ],
  mid_deal: [
    { key: "system_override", label: "System prompt override", placeholder: "Optional. Override the default AI instructions for mid-deal signals." },
    { key: "question_themes", label: "Question themes", placeholder: "e.g. competitors, win/loss, features, pricing, support" },
  ],
  prospecting: [
    { key: "system_override", label: "System prompt override", placeholder: "Optional. Override the default AI instructions for prospecting signals." },
    { key: "question_themes", label: "Question themes", placeholder: "e.g. current solution, pain points, contract expiry" },
  ],
};

type Props = {
  account: { id: string; name: string; product_description: string | null; differentiators: string | null } | null;
  prompts: Record<string, Record<string, string>>;
  teams?: { id: string; name: string }[];
};

export default function SettingsForm({ account, prompts, teams = [] }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"company" | "prompts" | "teams">("company");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [accountName, setAccountName] = useState(account?.name ?? "");
  const [productDescription, setProductDescription] = useState(account?.product_description ?? "");
  const [differentiators, setDifferentiators] = useState(account?.differentiators ?? "");

  const [promptValues, setPromptValues] = useState<Record<string, Record<string, string>>>(prompts);

  useEffect(() => {
    setAccountName(account?.name ?? "");
    setProductDescription(account?.product_description ?? "");
    setDifferentiators(account?.differentiators ?? "");
    setPromptValues(prompts);
  }, [account, prompts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: {
            name: accountName,
            product_description: productDescription || null,
            differentiators: differentiators || null,
          },
          prompts: promptValues,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }

      setMessage({ type: "success", text: "Settings saved." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setLoading(false);
    }
  }

  function setPrompt(signalType: string, key: string, value: string) {
    setPromptValues((prev) => ({
      ...prev,
      [signalType]: {
        ...(prev[signalType] || {}),
        [key]: value,
      },
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <div className="flex gap-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`pb-3 px-1 font-medium border-b-2 -mb-px ${
            activeTab === "company"
              ? "border-accent text-accent"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Company profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prompts")}
          className={`pb-3 px-1 font-medium border-b-2 -mb-px ${
            activeTab === "prompts"
              ? "border-accent text-accent"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          AI prompts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("teams")}
          className={`pb-3 px-1 font-medium border-b-2 -mb-px ${
            activeTab === "teams"
              ? "border-accent text-accent"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Teams
        </button>
      </div>

      {activeTab === "company" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Acme Inc"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product description
            </label>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Describe the SaaS product you sell. Used in AI prompts to personalise questions."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key differentiators
            </label>
            <textarea
              value={differentiators}
              onChange={(e) => setDifferentiators(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Bullet points or free text. What makes your solution unique?"
            />
          </div>
        </div>
      )}

      {activeTab === "prompts" && (
        <div className="space-y-8">
          <p className="text-sm text-gray-600">
            Customise the prompts sent to OpenAI for each signal type. Leave blank
            to use defaults.
          </p>
          {SIGNAL_TYPES.map(({ value, label }) => (
            <div key={value} className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-medium text-gray-900 mb-4">{label}</h3>
              <div className="space-y-4">
                {PROMPT_KEYS[value]?.map(({ key, label: l, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {l}
                    </label>
                    <textarea
                      value={promptValues[value]?.[key] ?? ""}
                      onChange={(e) => setPrompt(value, key, e.target.value)}
                      rows={key === "system_override" ? 6 : 2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent text-sm font-mono"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "teams" && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Create teams to filter Insights by AE group. Assign a manager to each
            team for role-based access.
          </p>
          <TeamsSection teams={teams} onUpdate={() => router.refresh()} />
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
