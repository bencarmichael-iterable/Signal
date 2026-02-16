import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SignalForm from "./SignalForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export default async function SignalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: signal, error } = await admin
    .from("signals")
    .select(`
      id,
      prospect_first_name,
      prospect_company,
      prospect_website_url,
      prospect_logo_url,
      generated_page_content,
      expires_at,
      status,
      users (full_name, company_name, photo_url, email)
    `)
    .eq("unique_slug", slug)
    .single();

  if (error || !signal) {
    notFound();
  }

  const expiresAt = new Date(signal.expires_at);
  if (expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <Link href="/" className="inline-block mb-8">
            <Image src="/signal-v2-logo-teal-accent.svg" alt="Signal" width={160} height={40} className="h-8 w-auto mx-auto" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            This page has expired
          </h1>
          <p className="text-gray-600">
            Signal links are valid for 30 days. Please ask your contact for a
            new link.
          </p>
        </div>
      </div>
    );
  }

  const content = signal.generated_page_content as {
    intro_paragraph: string;
    questions: { question_text: string; options: string[] }[];
    open_field_prompt: string;
    dynamic?: boolean;
  } | null;

  const users = signal.users as { full_name: string; company_name: string; photo_url: string | null; email: string }[] | null;
  const rep = Array.isArray(users) ? users[0] : users;
  const repName = rep?.full_name?.split(" ")[0] || "Your contact";

  return (
    <SignalForm
      signalId={signal.id}
      slug={slug}
      prospectName={signal.prospect_first_name}
      prospectCompany={signal.prospect_company}
      prospectWebsiteUrl={signal.prospect_website_url}
      prospectLogoUrl={signal.prospect_logo_url}
      introParagraph={content?.intro_paragraph ?? ""}
      initialQuestions={content?.questions ?? []}
      openFieldPrompt={content?.open_field_prompt ?? "Anything else you'd like to add?"}
      repName={repName}
      repCompany={rep?.company_name || ""}
      repEmail={rep?.email || null}
      dynamic={content?.dynamic ?? false}
    />
  );
}
