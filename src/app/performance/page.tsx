"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PerformanceFilters } from "@/components/PerformanceFilters";
import { LoadingState } from "@/components/LoadingState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DeveloperStats {
  developer: string;
  month: string;
  prCount: number;
  additions: number;
  deletions: number;
}

interface AnalyticsData {
  stats: DeveloperStats[];
  developers: { id: string; username: string }[];
  organizations: { id: string; name: string }[];
}

export default function PerformancePage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedOrg) params.set("org", selectedOrg);
      if (selectedDeveloper) params.set("developer", selectedDeveloper);
      if (fromDate) params.set("fromDate", format(fromDate, "yyyy-MM-dd"));
      if (toDate) params.set("toDate", format(toDate, "yyyy-MM-dd"));

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedDeveloper, selectedOrg, fromDate, toDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate summary stats
  const totalPRs = data?.stats.reduce((acc, s) => acc + s.prCount, 0) || 0;
  const totalAdditions = data?.stats.reduce((acc, s) => acc + s.additions, 0) || 0;
  const totalDeletions = data?.stats.reduce((acc, s) => acc + s.deletions, 0) || 0;
  const uniqueDevelopers = new Set(data?.stats.map((s) => s.developer)).size;

  return (
    <main className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Team Performance
              </h1>
              <p className="text-gray-600">
                Track PRs merged by team members over time
              </p>
            </div>
          </div>
          <Button onClick={fetchAnalytics} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total PRs Merged</CardDescription>
              <CardTitle className="text-3xl">{totalPRs}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Developers</CardDescription>
              <CardTitle className="text-3xl">{uniqueDevelopers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lines Added</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                +{totalAdditions.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lines Removed</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                -{totalDeletions.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter the chart by organization, developer, or date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceFilters
              developers={data?.developers || []}
              organizations={data?.organizations || []}
              selectedDeveloper={selectedDeveloper}
              selectedOrg={selectedOrg}
              fromDate={fromDate}
              toDate={toDate}
              onDeveloperChange={setSelectedDeveloper}
              onOrgChange={setSelectedOrg}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
            />
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>PRs Merged per Month by Developer</CardTitle>
            <CardDescription>
              Stacked bar chart showing contribution distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingState message="Loading analytics data..." />
            ) : (
              <PerformanceChart data={data?.stats || []} />
            )}
          </CardContent>
        </Card>

        {/* Developer Stats Table */}
        {data && data.stats.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Developer Statistics</CardTitle>
              <CardDescription>
                Detailed breakdown by developer and month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Developer</th>
                      <th className="text-left py-3 px-4 font-medium">Month</th>
                      <th className="text-right py-3 px-4 font-medium">PRs</th>
                      <th className="text-right py-3 px-4 font-medium">Additions</th>
                      <th className="text-right py-3 px-4 font-medium">Deletions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stats.map((stat, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{stat.developer}</td>
                        <td className="py-3 px-4">{stat.month}</td>
                        <td className="py-3 px-4 text-right">{stat.prCount}</td>
                        <td className="py-3 px-4 text-right text-green-600">
                          +{stat.additions.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          -{stat.deletions.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
