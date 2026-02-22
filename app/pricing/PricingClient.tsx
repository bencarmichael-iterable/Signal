"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  isLoggedIn: boolean;
};

export default function PricingClient({ isLoggedIn }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (isLoggedIn) {
    return (
      <div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="block w-full py-3 text-center bg-white text-primary font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Redirecting..." : "Upgrade to Premium"}
        </button>
        {error && (
          <p className="mt-3 text-sm text-primary-100">
            {error}.{" "}
            <Link href="/dashboard/settings" className="underline">
              Upgrade from Settings
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/signup"
      className="block w-full py-3 text-center bg-white text-primary font-medium rounded-lg hover:bg-gray-100"
    >
      Sign up for Premium
    </Link>
  );
}
