import {
  Deployment,
  PullRequest,
  DORALevel,
  DeploymentFrequencyResult,
  LeadTimeResult,
  LeadTimeItem,
  DORAMetricsData,
} from "@/types";

function daysBetween(from: string, to: string): number {
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(diff / (1000 * 60 * 60 * 24), 1);
}

function hoursBetween(from: string, to: string): number {
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(diff / (1000 * 60 * 60), 0);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().split("T")[0];
}

function classifyDeploymentFrequency(deploymentsPerDay: number): DORALevel {
  // DORA standards:
  // Elite: Multiple deploys per day (on-demand)
  // High: Between once per day and once per week
  // Medium: Between once per week and once per month
  // Low: Less than once per month
  if (deploymentsPerDay >= 1) return "elite";
  if (deploymentsPerDay >= 1 / 7) return "high";
  if (deploymentsPerDay >= 1 / 30) return "medium";
  return "low";
}

function classifyLeadTime(medianHours: number): DORALevel {
  // DORA standards:
  // Elite: Less than one hour
  // High: Between one hour and one day
  // Medium: Between one day and one week
  // Low: More than one week
  if (medianHours < 1) return "elite";
  if (medianHours < 24) return "high";
  if (medianHours < 168) return "medium";
  return "low";
}

export function calculateDeploymentFrequency(
  deployments: Deployment[],
  prs: PullRequest[],
  fromDate: string,
  toDate: string,
  source: "deployments" | "releases" | "pull_requests"
): DeploymentFrequencyResult {
  const periodDays = daysBetween(fromDate, toDate);

  // If no deployments/releases, use merged PRs as proxy
  const events =
    source === "pull_requests"
      ? prs.map((pr) => ({ repo: pr.repo, createdAt: pr.mergedAt }))
      : deployments.map((d) => ({ repo: d.repo, createdAt: d.createdAt }));

  const totalDeployments = events.length;
  const deploymentsPerDay = totalDeployments / periodDays;
  const deploymentsPerWeek = deploymentsPerDay * 7;

  // Group by repo
  const deploymentsByRepo: Record<string, number> = {};
  for (const event of events) {
    deploymentsByRepo[event.repo] = (deploymentsByRepo[event.repo] || 0) + 1;
  }

  // Weekly trend
  const weeklyMap: Record<string, number> = {};
  for (const event of events) {
    const week = getWeekLabel(new Date(event.createdAt));
    weeklyMap[week] = (weeklyMap[week] || 0) + 1;
  }

  // Fill in missing weeks
  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    const week = getWeekLabel(d);
    if (!weeklyMap[week]) weeklyMap[week] = 0;
  }

  const weeklyTrend = Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));

  return {
    totalDeployments,
    deploymentsPerDay,
    deploymentsPerWeek,
    periodDays,
    deploymentsByRepo,
    weeklyTrend,
    performanceLevel: classifyDeploymentFrequency(deploymentsPerDay),
    source,
  };
}

export function calculateLeadTime(prs: PullRequest[]): LeadTimeResult {
  const items: LeadTimeItem[] = [];

  for (const pr of prs) {
    // Find earliest commit date in this PR
    let firstCommitDate: string | null = null;
    if (pr.commits.length > 0) {
      const commitDates = pr.commits
        .map((c) => c.date)
        .filter((d) => d)
        .sort();
      firstCommitDate = commitDates[0] || null;
    }

    const firstCommitToMergeHours = firstCommitDate
      ? hoursBetween(firstCommitDate, pr.mergedAt)
      : hoursBetween(pr.createdAt, pr.mergedAt);

    const openToMergeHours = hoursBetween(pr.createdAt, pr.mergedAt);

    items.push({
      repo: pr.repo,
      prNumber: pr.number,
      title: pr.title,
      author: pr.author,
      firstCommitToMergeHours,
      openToMergeHours,
      mergedAt: pr.mergedAt,
    });
  }

  const leadTimes = items.map((i) => i.firstCommitToMergeHours);
  const avg =
    leadTimes.length > 0
      ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
      : 0;
  const med = median(leadTimes);
  const p90 = percentile(leadTimes, 90);

  return {
    averageHours: avg,
    medianHours: med,
    p90Hours: p90,
    items: items.sort((a, b) => b.firstCommitToMergeHours - a.firstCommitToMergeHours),
    performanceLevel: classifyLeadTime(med),
  };
}

export function calculateDORAMetrics(
  deployments: Deployment[],
  prs: PullRequest[],
  fromDate: string,
  toDate: string,
  source: "deployments" | "releases" | "pull_requests"
): DORAMetricsData {
  return {
    deploymentFrequency: calculateDeploymentFrequency(
      deployments,
      prs,
      fromDate,
      toDate,
      source
    ),
    leadTime: calculateLeadTime(prs),
  };
}
