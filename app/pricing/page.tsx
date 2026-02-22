import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image src="/signal-v2-logo-teal-accent.svg" alt="Signal" width={160} height={40} className="h-8 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-gray-600 hover:text-primary">
                Pricing
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-primary">
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Simple pricing
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Start free. Upgrade when you need more.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Free</h2>
            <p className="text-3xl font-bold text-gray-900 mb-1">$0</p>
            <p className="text-gray-500 text-sm mb-6">per month</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-700">
                <span className="text-accent">✓</span> 3 Signals per month
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <span className="text-accent">✓</span> AI-generated micro-pages
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <span className="text-accent">✓</span> Response summaries
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full py-3 text-center border-2 border-primary text-primary font-medium rounded-lg hover:bg-primary/5"
            >
              Get started free
            </Link>
          </div>

          <div className="bg-primary rounded-2xl border-2 border-primary p-8 text-white relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
              Most popular
            </span>
            <h2 className="text-xl font-semibold mb-2">Premium</h2>
            <p className="text-3xl font-bold mb-1">$29</p>
            <p className="text-primary-100 text-sm mb-6">per month</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <span>✓</span> Unlimited Signals
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Everything in Free
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Priority support
              </li>
            </ul>
            <PricingClient isLoggedIn={!!user} />
          </div>
        </div>
      </div>
    </div>
  );
}
