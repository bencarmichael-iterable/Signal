import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, company_name, photo_url, company_logo_url")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Account</h1>
      <p className="text-gray-600 mb-8">
        Update your profile and company information. This appears on your Signal
        micro-pages.
      </p>
      <AccountForm
        userId={user.id}
        initialFullName={profile?.full_name ?? user.user_metadata?.full_name ?? ""}
        initialCompanyName={profile?.company_name ?? user.user_metadata?.company_name ?? ""}
        initialPhotoUrl={profile?.photo_url ?? ""}
        initialCompanyLogoUrl={profile?.company_logo_url ?? ""}
      />
    </div>
  );
}
