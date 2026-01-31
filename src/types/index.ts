export interface Repository {
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface PullRequest {
  repo: string;
  number: number;
  title: string;
  description: string | null;
  author: string;
  createdAt: string;
  mergedAt: string;
  commits: Commit[];
  additions: number;
  deletions: number;
  changedFiles: number;
  url: string;
}

export interface PRsResponse {
  totalPRs: number;
  prs: PullRequest[];
}

export interface SummaryStats {
  features: number;
  fixes: number;
  refactoring: number;
  docs: number;
  other: number;
}

export interface SummaryResponse {
  summary: string;
  stats: SummaryStats;
}

export interface ReposResponse {
  repos: Repository[];
}

export interface APIError {
  error: string;
  details?: string;
}

// DORA Metrics types

export interface Deployment {
  id: number;
  environment: string;
  createdAt: string;
  repo: string;
  ref: string;
  description: string | null;
}

export type DORALevel = "elite" | "high" | "medium" | "low";

export interface DeploymentFrequencyResult {
  totalDeployments: number;
  deploymentsPerDay: number;
  deploymentsPerWeek: number;
  periodDays: number;
  deploymentsByRepo: Record<string, number>;
  weeklyTrend: { week: string; count: number }[];
  performanceLevel: DORALevel;
  source: "deployments" | "releases" | "pull_requests";
}

export interface LeadTimeItem {
  repo: string;
  prNumber: number;
  title: string;
  author: string;
  firstCommitToMergeHours: number;
  openToMergeHours: number;
  mergedAt: string;
}

export interface LeadTimeResult {
  averageHours: number;
  medianHours: number;
  p90Hours: number;
  items: LeadTimeItem[];
  performanceLevel: DORALevel;
}

export interface DORAMetricsData {
  deploymentFrequency: DeploymentFrequencyResult;
  leadTime: LeadTimeResult;
}

export interface DORAMetricsResponse {
  metrics: DORAMetricsData;
}
