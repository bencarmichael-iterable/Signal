import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ManagerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("account_id, role, team_id")
    .eq("id", user.id)
    .single();

  // Managers: role=manager or they manage a team
  const { data: managedTeams } = await admin
    .from("teams")
    .select("id, name")
    .eq("manager_id", user.id);

  const isManager = profile?.role === "manager" || (managedTeams && managedTeams.length > 0);

  if (!isManager && profile?.role !== "admin") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Manager dashboard</h1>
        <p className="text-gray-600">You don&apos;t have access to the manager dashboard.</p>
      </div>
    );
  }

  // Get all teams for the account (for admins) or managed teams
  const teamIds = managedTeams?.map((t) => t.id) ?? [];
  const { data: teams } = await admin
    .from("teams")
    .select("id, name, manager_id")
    .eq("account_id", profile?.account_id ?? "");

  const displayTeams = profile?.role === "admin" ? teams ?? [] : managedTeams ?? [];

  const teamStats: { teamId: string; teamName: string; completed: number; total: number; topAes: { name: string; completed: number }[] }[] = [];

  for (const team of displayTeams) {
    const { data: teamUsers } = await admin
      .from("users")
      .select("id, full_name")
      .eq("team_id", team.id);

    const userIds = teamUsers?.map((u) => u.id) ?? [];
    if (userIds.length === 0) {
      teamStats.push({ teamId: team.id, teamName: team.name, completed: 0, total: 0, topAes: [] });
      continue;
    }

    const { data: signals } = await admin
      .from("signals")
      .select("id, user_id, status")
      .in("user_id", userIds);

    const total = signals?.length ?? 0;
    const completed = signals?.filter((s) => s.status === "completed").length ?? 0;

    const byUser: Record<string, number> = {};
    for (const s of signals ?? []) {
      if (s.status === "completed") {
        byUser[s.user_id] = (byUser[s.user_id] ?? 0) + 1;
      }
    }
    const topAes = (teamUsers ?? [])
      .map((u) => ({ name: u.full_name || "Unknown", completed: byUser[u.id] ?? 0 }))
      .filter((a) => a.completed > 0)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);

    teamStats.push({ teamId: team.id, teamName: team.name, completed, total, topAes });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Manager dashboard</h1>
      <p className="text-gray-600 mb-8">
        Team completion rates and top performers.{" "}
        <Link href="/dashboard/insights" className="text-accent hover:underline">
          View full Insights →
        </Link>
      </p>

      <div className="space-y-3">
        {teamStats.map((team) => (
          <div key={team.teamId} className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-2">{team.teamName}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {team.completed}/{team.total} completed
              {team.total > 0 && (
                <span className="text-accent ml-1">
                  ({Math.round((team.completed / team.total) * 100)}%)
                </span>
              )}
            </p>
            {team.topAes.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Top performers</p>
                <ul className="space-y-1">
                  {team.topAes.map((ae, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{ae.name}</span>
                      <span className="text-gray-500 ml-2">{ae.completed} completed</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {displayTeams.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          No teams yet. Create teams in Settings to see team metrics.
        </p>
      )}
    </div>
  );
}
