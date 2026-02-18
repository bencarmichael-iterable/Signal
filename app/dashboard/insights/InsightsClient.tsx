"use client";

import { useState, useEffect } from "react";

type Props = {
  teams: { id: string; name: string }[];
};

export default function InsightsClient({ teams }: Props) {
  const [teamId, setTeamId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<{
    insights: string;
    responseCount: number;
    signalCount: number;
    recommendationDistribution: { recommendation: string; count: number }[];
    funnel?: { created: number; sent: number; opened: number; completed: number };
    performanceByType?: Record<string, { created: number; completed: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (teamId) params.set("team_id", teamId);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    fetch(`/api/insights?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [teamId, startDate, endDate]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-end">
        {teams.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent"
            >
              <option value="">All teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {data && (
        <>
          {data.funnel && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Funnel</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{data.funnel.created}</p>
                  <p className="text-sm text-gray-500">Created</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{data.funnel.sent}</p>
                  <p className="text-sm text-gray-500">Sent</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{data.funnel.opened}</p>
                  <p className="text-sm text-gray-500">Opened</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-accent">{data.funnel.completed}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
            </div>
          )}

          {data.performanceByType && Object.keys(data.performanceByType).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Performance by type</h3>
              <div className="space-y-3">
                {Object.entries(data.performanceByType).map(([type, stats]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize text-gray-700">{type.replace(/_/g, " ")}</span>
                    <span className="text-sm text-gray-600">
                      {stats.completed}/{stats.created} completed
                      {stats.created > 0 && (
                        <span className="text-accent ml-1">
                          ({Math.round((stats.completed / stats.created) * 100)}%)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-1">Completed Signals</h3>
              <p className="text-2xl font-semibold text-accent">{data.signalCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-1">Responses</h3>
              <p className="text-2xl font-semibold text-accent">{data.responseCount}</p>
            </div>
          </div>

          {data.recommendationDistribution.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">
                Recommendation distribution
              </h3>
              <div className="space-y-2">
                {data.recommendationDistribution.map(({ recommendation, count }) => (
                  <div key={recommendation} className="flex items-center gap-4">
                    <span className="capitalize text-gray-700 w-40">
                      {recommendation}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{
                          width: `${(count / data.responseCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.insights && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Qualitative insights</h3>
              <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {data.insights}
              </div>
            </div>
          )}

          {data.responseCount === 0 && (
            <p className="text-gray-500 text-center py-12">
              No completed Signals yet. Create and send Signals to see insights here.
            </p>
          )}
        </>
      )}
    </div>
  );
}
