import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; canceled?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  let { data: profile, error: profileError } = await admin
    .from("users")
    .select("id, email, role, account_id")
    .eq("id", user.id)
    .single();

  // Fallback: lookup by email if id lookup fails (handles id mismatch from trigger/insert issues)
  if (!profile && user.email) {
    const byEmail = await admin
      .from("users")
      .select("id, email, role, account_id")
      .eq("email", user.email)
      .single();
    if (byEmail.data) {
      profile = byEmail.data;
    }
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
        <p className="text-red-600 mb-4">
          Admin access required. Only account admins can modify settings.
        </p>
        <p className="text-sm text-gray-500 font-mono space-y-1">
          <span className="block">Debug: logged in as {user.email}</span>
          <span className="block">Auth user id: {user.id}</span>
          <span className="block">Profile: {profile ? `role="${profile.role}"` : "not found"}</span>
          {profileError && (
            <span className="block text-red-600">Query error: {profileError.message} (code: {profileError.code})</span>
          )}
        </p>
      </div>
    );
  }

  let account = null;
  let prompts: Record<string, Record<string, string>> = {};
  const accountId = profile.account_id;

  if (accountId) {
    const { data: acc } = await admin
      .from("accounts")
      .select("id, name, product_description, differentiators, plan")
      .eq("id", accountId)
      .single();
    account = acc;

    const { data: promptRows } = await admin
      .from("account_prompts")
      .select("signal_type, prompt_key, prompt_value")
      .eq("account_id", accountId);

    for (const p of promptRows || []) {
      if (!prompts[p.signal_type]) prompts[p.signal_type] = {};
      prompts[p.signal_type][p.prompt_key] = p.prompt_value;
    }
  }

  let teams: { id: string; name: string }[] = [];
  if (accountId) {
    const { data: teamRows } = await admin
      .from("teams")
      .select("id, name")
      .eq("account_id", accountId);
    teams = teamRows ?? [];
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-600 mb-8">
        Configure your company profile and AI prompts. These settings apply
        account-wide.
      </p>
      <SettingsForm
        account={account}
        prompts={prompts}
        teams={teams}
        accountPlan={account?.plan ?? "free"}
        upgraded={params.upgraded === "1"}
        canceled={params.canceled === "1"}
      />
    </div>
  );
}
