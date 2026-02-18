"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  initialFullName: string;
  initialCompanyName: string;
  initialPhotoUrl: string;
  initialCompanyLogoUrl: string;
  initialLinkedinUrl?: string;
};

export default function AccountForm({
  userId,
  initialFullName,
  initialCompanyName,
  initialPhotoUrl,
  initialCompanyLogoUrl,
  initialLinkedinUrl = "",
}: Props) {
  const [fullName, setFullName] = useState(initialFullName);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(initialCompanyLogoUrl);
  const [linkedinUrl, setLinkedinUrl] = useState(initialLinkedinUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName || null,
        company_name: companyName || null,
        photo_url: photoUrl || null,
        company_logo_url: companyLogoUrl || null,
        linkedin_url: linkedinUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "Profile updated." });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile photo
        </label>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-medium text-gray-400">
                {(fullName || "?")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste a URL to your photo (e.g. from LinkedIn or a hosted image).
            </p>
          </div>
        </div>
      </div>

      {/* Full name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
          placeholder="Jane Smith"
        />
      </div>

      {/* Company name */}
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
          Company name
        </label>
        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
          placeholder="Acme Inc"
        />
      </div>

      {/* LinkedIn */}
      <div>
        <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn profile URL
        </label>
        <input
          id="linkedinUrl"
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
          placeholder="https://linkedin.com/in/yourprofile"
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional. Shown as &quot;Meet [name] on LinkedIn&quot; on your Signal pages.
        </p>
      </div>

      {/* Company logo */}
      <div>
        <label htmlFor="companyLogoUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Company logo URL
        </label>
        <input
          id="companyLogoUrl"
          type="url"
          value={companyLogoUrl}
          onChange={(e) => setCompanyLogoUrl(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
          placeholder="https://..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional. Shown on your Signal micro-pages. Leave blank to hide.
        </p>
      </div>

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
        disabled={saving}
        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
