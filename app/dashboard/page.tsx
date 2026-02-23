import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import CreateSignalDropdown from "./CreateSignalDropdown";

const STATUS_COLORS: Record<string, string> = {
  created: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  opened: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
};

function getGreeting() {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatRecommendation(rec: string) {
  return rec
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatLastActivity(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, account_id, plan")
    .eq("id", user!.id)
    .single();

  let viewableSignalIds = new Set<string>();
  const userPlan = profile?.plan ?? "free";
  const isPremium = userPlan === "premium" || userPlan === "pro";
  if (!isPremium) {
    const admin = createAdminClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: userSignals } = await admin
      .from("signals")
      .select("id")
      .eq("user_id", user!.id);
    const userSignalIds = new Set(userSignals?.map((s) => s.id) ?? []);
    if (userSignalIds.size > 0) {
      const { data: responses } = await admin
        .from("responses")
        .select("signal_id, completed_at")
        .not("completed_at", "is", null)
        .gte("completed_at", startOfMonth.toISOString());
      const userResponses = (responses ?? []).filter((r) => userSignalIds.has(r.signal_id));
      const sorted = userResponses.sort(
        (a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime()
      );
      sorted.slice(0, 3).forEach((r) => viewableSignalIds.add(r.signal_id));
    }
  }

  const firstName =
    (profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "")
      .split(" ")[0] || "there";

  const { data: signals } = await supabase
    .from("signals")
    .select(`
      id,
      prospect_first_name,
      prospect_company,
      status,
      unique_slug,
      created_at,
      responses (ai_recommendation, ai_summary)
    `)
    .order("created_at", { ascending: false });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = signals?.filter((s) => new Date(s.created_at) >= startOfMonth) ?? [];
  const sentCount = thisMonth.filter((s) => ["sent", "opened", "completed"].includes(s.status)).length;
  const completedCount = thisMonth.filter((s) => s.status === "completed").length;
  const lastSignal = signals?.[0];
  const lastActivity = lastSignal
    ? formatLastActivity(new Date(lastSignal.created_at))
    : null;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-gray-600 mt-1">
            {!signals || signals.length === 0
              ? "Create your first Signal to engage prospects and move deals forward."
              : `You have ${signals.length} Signal${signals.length === 1 ? "" : "s"}.`}
          </p>
          {lastActivity && (
            <p className="text-gray-500 text-sm mt-0.5">
              Last Signal created {lastActivity}.
            </p>
          )}
          {signals && signals.length > 0 && (sentCount > 0 || completedCount > 0) && (
            <p className="text-gray-500 text-sm mt-0.5">
              This month: {sentCount} sent, {completedCount} completed.
            </p>
          )}
        </div>
        <CreateSignalDropdown />
      </div>

      {!signals || signals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600">
            No Signals yet. Use the Create Signal button above to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Prospect
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Created
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Summary
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Recommendation
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {signals.map((signal) => (
                  <tr key={signal.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium">
                        {signal.prospect_first_name}
                      </span>
                      <span className="text-gray-500 ml-1">
                        @ {signal.prospect_company}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {new Date(signal.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          STATUS_COLORS[signal.status] || "bg-gray-100"
                        }`}
                      >
                        {formatStatus(signal.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={isPremium || viewableSignalIds.has(signal.id) ? signal.responses?.[0]?.ai_summary ?? undefined : undefined}>
                      {!isPremium && signal.responses?.[0] && !viewableSignalIds.has(signal.id) ? (
                        <Link href="/dashboard/settings" className="text-amber-600 hover:underline">
                          Upgrade to view
                        </Link>
                      ) : signal.responses?.[0]?.ai_summary ? (
                        signal.responses[0].ai_summary.split(/[.!?]/)[0] + (signal.responses[0].ai_summary.includes(".") ? "." : "")
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {!isPremium && signal.responses?.[0] && !viewableSignalIds.has(signal.id) ? (
                        <Link href="/dashboard/settings" className="text-amber-600 hover:underline">
                          Upgrade to view
                        </Link>
                      ) : signal.responses?.[0]?.ai_recommendation ? (
                        formatRecommendation(signal.responses[0].ai_recommendation)
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/signal/${signal.id}`}
                        className="text-accent hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
