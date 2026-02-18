import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .single();

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

  if (profile.account_id) {
    const { data: acc } = await admin
      .from("accounts")
      .select("id, name, product_description, differentiators")
      .eq("id", profile.account_id)
      .single();
    account = acc;

    const { data: promptRows } = await admin
      .from("account_prompts")
      .select("signal_type, prompt_key, prompt_value")
      .eq("account_id", profile.account_id);

    for (const p of promptRows || []) {
      if (!prompts[p.signal_type]) prompts[p.signal_type] = {};
      prompts[p.signal_type][p.prompt_key] = p.prompt_value;
    }
  }

  let teams: { id: string; name: string }[] = [];
  if (profile.account_id) {
    const { data: teamRows } = await admin
      .from("teams")
      .select("id, name")
      .eq("account_id", profile.account_id);
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
      />
    </div>
  );
}
