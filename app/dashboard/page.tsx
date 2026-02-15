import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  created: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  opened: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: signals } = await supabase
    .from("signals")
    .select(`
      id,
      prospect_first_name,
      prospect_company,
      status,
      unique_slug,
      created_at,
      responses (ai_recommendation)
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Your Signals</h1>
        <Link
          href="/dashboard/new"
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
        >
          New Signal
        </Link>
      </div>

      {!signals || signals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">
            No Signals yet. Create your first one to recover a stalled deal.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-block px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90"
          >
            Create your first Signal
          </Link>
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
                        {signal.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {signal.responses?.[0]?.ai_recommendation
                        ? signal.responses[0].ai_recommendation.replace("_", " ")
                        : "—"}
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
