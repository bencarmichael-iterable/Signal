"use client";

import { useState } from "react";

type Props = {
  plan: string;
  onUpgrade: () => void;
};

export default function BillingSection({ plan, onUpgrade }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPremium = plan === "premium";

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-2">Current plan</h3>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {isPremium ? "Premium" : "Free"}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {isPremium
            ? "Unlimited Signals, priority support"
            : "3 Signals per month"}
        </p>

        {!isPremium && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Upgrade to Premium for unlimited Signals and priority support.
            </p>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Redirecting..." : "Upgrade to Premium — $29/mo"}
            </button>
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}

        {isPremium && (
          <p className="text-sm text-gray-500">
            Thank you for being a Premium customer.
          </p>
        )}
      </div>
    </div>
  );
}
