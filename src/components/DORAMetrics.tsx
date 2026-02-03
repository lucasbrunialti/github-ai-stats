"use client";

import { DORAMetricsData, DORALevel } from "@/types";

interface DORAMetricsProps {
  metrics: DORAMetricsData;
  org: string;
  fromDate: string;
  toDate: string;
}

const LEVEL_CONFIG: Record<
  DORALevel,
  { label: string; color: string; bg: string; border: string; barColor: string }
> = {
  elite: {
    label: "Elite",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    barColor: "bg-emerald-500",
  },
  high: {
    label: "High",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    barColor: "bg-blue-500",
  },
  medium: {
    label: "Medium",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    barColor: "bg-amber-500",
  },
  low: {
    label: "Low",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    barColor: "bg-red-500",
  },
};

function LevelBadge({ level }: { level: DORALevel }) {
  const config = LEVEL_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${config.border} border`}
    >
      {config.label}
    </span>
  );
}

function formatHours(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  if (days < 7) {
    return `${days.toFixed(1)}d`;
  }
  const weeks = days / 7;
  return `${weeks.toFixed(1)}w`;
}

function formatFrequency(perDay: number): string {
  if (perDay >= 1) {
    return `${perDay.toFixed(1)}/day`;
  }
  const perWeek = perDay * 7;
  if (perWeek >= 1) {
    return `${perWeek.toFixed(1)}/week`;
  }
  const perMonth = perDay * 30;
  return `${perMonth.toFixed(1)}/month`;
}

function sourceLabel(source: string): string {
  switch (source) {
    case "deployments":
      return "GitHub Deployments";
    case "releases":
      return "GitHub Releases";
    case "pull_requests":
      return "Merged PRs (proxy)";
    default:
      return source;
  }
}

function WeeklyTrendBar({
  trend,
}: {
  trend: { week: string; count: number }[];
}) {
  const maxCount = Math.max(...trend.map((t) => t.count), 1);

  return (
    <div className="mt-4">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Weekly Trend
      </h4>
      <div className="flex items-end gap-1 h-20">
        {trend.map((item) => {
          const height = Math.max((item.count / maxCount) * 100, 4);
          return (
            <div
              key={item.week}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-[10px] text-gray-500">{item.count}</span>
              <div
                className="w-full bg-blue-400 rounded-t transition-all"
                style={{ height: `${height}%` }}
                title={`Week of ${item.week}: ${item.count}`}
              />
              <span className="text-[9px] text-gray-400 truncate w-full text-center">
                {item.week.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DORAMetrics({
  metrics,
  org,
  fromDate,
  toDate,
}: DORAMetricsProps) {
  const { deploymentFrequency: df, leadTime: lt } = metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            DORA Metrics — {org}
          </h2>
          <p className="text-sm text-gray-500">
            {fromDate} to {toDate} | {df.periodDays.toFixed(0)} days analyzed
          </p>
        </div>

        {/* Metric Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deployment Frequency */}
          <div
            className={`rounded-lg border p-5 ${LEVEL_CONFIG[df.performanceLevel].bg} ${LEVEL_CONFIG[df.performanceLevel].border}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-600">
                  Deployment Frequency
                </h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatFrequency(df.deploymentsPerDay)}
                </p>
              </div>
              <LevelBadge level={df.performanceLevel} />
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">{df.totalDeployments}</span>{" "}
                total deployments
              </p>
              <p>
                <span className="font-medium">
                  {df.deploymentsPerWeek.toFixed(1)}
                </span>{" "}
                per week
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Source: {sourceLabel(df.source)}
              </p>
            </div>

            {df.weeklyTrend.length > 1 && (
              <WeeklyTrendBar trend={df.weeklyTrend} />
            )}
          </div>

          {/* Lead Time for Changes */}
          <div
            className={`rounded-lg border p-5 ${LEVEL_CONFIG[lt.performanceLevel].bg} ${LEVEL_CONFIG[lt.performanceLevel].border}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-600">
                  Lead Time for Changes
                </h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatHours(lt.medianHours)}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    median
                  </span>
                </p>
              </div>
              <LevelBadge level={lt.performanceLevel} />
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                Average:{" "}
                <span className="font-medium">
                  {formatHours(lt.averageHours)}
                </span>
              </p>
              <p>
                P90:{" "}
                <span className="font-medium">
                  {formatHours(lt.p90Hours)}
                </span>
              </p>
              <p>
                <span className="font-medium">{lt.items.length}</span> PRs
                analyzed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DORA Level Reference */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            DORA Performance Levels Reference
          </h3>
        </div>
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase">
                <th className="pb-2 pr-4">Level</th>
                <th className="pb-2 pr-4">Deploy Frequency</th>
                <th className="pb-2">Lead Time</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-t border-gray-100">
                <td className="py-1.5 pr-4">
                  <LevelBadge level="elite" />
                </td>
                <td className="py-1.5 pr-4">Multiple per day</td>
                <td className="py-1.5">&lt; 1 hour</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-1.5 pr-4">
                  <LevelBadge level="high" />
                </td>
                <td className="py-1.5 pr-4">Daily to weekly</td>
                <td className="py-1.5">1 hour — 1 day</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-1.5 pr-4">
                  <LevelBadge level="medium" />
                </td>
                <td className="py-1.5 pr-4">Weekly to monthly</td>
                <td className="py-1.5">1 day — 1 week</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-1.5 pr-4">
                  <LevelBadge level="low" />
                </td>
                <td className="py-1.5 pr-4">&lt; once per month</td>
                <td className="py-1.5">&gt; 1 week</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Deployment Breakdown by Repo */}
      {Object.keys(df.deploymentsByRepo).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">
              Deployments by Repository
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {Object.entries(df.deploymentsByRepo)
                .sort(([, a], [, b]) => b - a)
                .map(([repo, count]) => {
                  const maxCount = Math.max(
                    ...Object.values(df.deploymentsByRepo)
                  );
                  const width = Math.max((count / maxCount) * 100, 2);
                  return (
                    <div key={repo} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-40 truncate font-medium">
                        {repo}
                      </span>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded transition-all"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Lead Time Details */}
      {lt.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">
              Lead Time Details (Top 20 slowest)
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {lt.items.slice(0, 20).map((item) => {
              const maxLead = lt.items[0]?.firstCommitToMergeHours || 1;
              const width = Math.max(
                (item.firstCommitToMergeHours / maxLead) * 100,
                2
              );
              return (
                <div key={`${item.repo}-${item.prNumber}`} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                      {item.repo} #{item.prNumber} — {item.title}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      {formatHours(item.firstCommitToMergeHours)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all ${
                          item.firstCommitToMergeHours > lt.p90Hours
                            ? "bg-red-400"
                            : item.firstCommitToMergeHours > lt.medianHours
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      by {item.author}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
