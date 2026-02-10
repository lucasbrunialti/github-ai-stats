"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Settings } from "lucide-react";
import {
  OrgInput,
  DateRangePicker,
  RepoSelector,
  SummaryReport,
  LoadingState,
  PRList,
} from "@/components";
import { Repository, PullRequest } from "@/types";

type Step = "org" | "repos" | "loading-prs" | "prs" | "loading-summary" | "summary";

export default function Home() {
  const [step, setStep] = useState<Step>("org");
  const [org, setOrg] = useState("");
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);

  const handleLoadRepos = async (orgName: string) => {
    setIsLoadingRepos(true);
    setError(null);
    setOrg(orgName);

    try {
      const response = await fetch(`/api/orgs/${encodeURIComponent(orgName)}/repos`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load repositories");
      }

      setRepos(data.repos);
      setSelectedRepos(data.repos.slice(0, 10).map((r: Repository) => r.name));
      setStep("repos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleFetchPRs = async () => {
    setStep("loading-prs");
    setError(null);

    try {
      const response = await fetch("/api/prs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org,
          repos: selectedRepos,
          fromDate,
          toDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch PRs");
      }

      setPRs(data.prs);
      setStep("prs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("repos");
    }
  };

  const handleGenerateSummary = async () => {
    setStep("loading-summary");
    setError(null);
    setSummary("");

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org,
          prs,
          fromDate,
          toDate,
          stream: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate summary");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      setStep("summary");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setSummary((prev) => prev + chunk);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("prs");
    }
  };

  const handleReset = () => {
    setStep("org");
    setOrg("");
    setRepos([]);
    setSelectedRepos([]);
    setPRs([]);
    setSummary("");
    setError(null);
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GitHub PR Summary
          </h1>
          <p className="text-gray-600">
            AI-powered engineering reports for leadership
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <Link
              href="/performance"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <BarChart3 className="h-4 w-4" />
              Team Performance
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <Settings className="h-4 w-4" />
              Scheduled Reports
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Organization Input */}
        {step === "org" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <OrgInput onLoadRepos={handleLoadRepos} isLoading={isLoadingRepos} />
          </div>
        )}

        {/* Step 2: Repository Selection */}
        {step === "repos" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Configure Report for{" "}
                  <span className="text-blue-600">{org}</span>
                </h2>
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Change Organization
                </button>
              </div>

              <RepoSelector
                repos={repos}
                selectedRepos={selectedRepos}
                onSelectionChange={setSelectedRepos}
              />

              <DateRangePicker
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
              />

              <button
                onClick={handleFetchPRs}
                disabled={selectedRepos.length === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Fetch Pull Requests
              </button>
            </div>
          </div>
        )}

        {/* Loading PRs */}
        {step === "loading-prs" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <LoadingState message="Fetching merged pull requests..." />
          </div>
        )}

        {/* Step 3: PR List */}
        {step === "prs" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pull Requests Found
                </h2>
                <button
                  onClick={() => setStep("repos")}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to Selection
                </button>
              </div>

              <PRList prs={prs} />

              {prs.length > 0 && (
                <button
                  onClick={handleGenerateSummary}
                  className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Generate AI Summary
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Summary */}
        {step === "loading-summary" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <LoadingState message="Generating AI summary with Claude..." />
          </div>
        )}

        {/* Step 4: Summary Report */}
        {step === "summary" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("prs")}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to PRs
              </button>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Start New Report
              </button>
            </div>

            <SummaryReport
              summary={summary}
              org={org}
              fromDate={fromDate}
              toDate={toDate}
              totalPRs={prs.length}
            />
          </div>
        )}
      </div>
    </main>
  );
}
