import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import InsightsClient from "./InsightsClient";

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .single();

  let teams: { id: string; name: string }[] = [];
  if (profile?.account_id) {
    const { data } = await admin
      .from("teams")
      .select("id, name")
      .eq("account_id", profile.account_id);
    teams = data ?? [];
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Insights</h1>
      <p className="text-gray-600 mb-8">
        Aggregate feedback from completed Signals. See what&apos;s working and why
        deals are stalling.
      </p>
      <InsightsClient teams={teams} />
    </div>
  );
}
