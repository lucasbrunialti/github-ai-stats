import { NextRequest, NextResponse } from "next/server";
import { getDeploymentsForRepos, getMergedPRs } from "@/services/github";
import { calculateDORAMetrics } from "@/services/dora";
import { DORAMetricsResponse, APIError } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<DORAMetricsResponse | APIError>> {
  try {
    const body = await request.json();
    const { org, repos, fromDate, toDate } = body;

    if (!org || !repos || !fromDate || !toDate) {
      return NextResponse.json(
        { error: "Missing required fields: org, repos, fromDate, toDate" },
        { status: 400 }
      );
    }

    if (!Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json(
        { error: "repos must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch deployments/releases and PRs in parallel
    const [deploymentResult, prs] = await Promise.all([
      getDeploymentsForRepos(org, repos, fromDate, toDate),
      getMergedPRs(org, repos, fromDate, toDate),
    ]);

    const metrics = calculateDORAMetrics(
      deploymentResult.deployments,
      prs,
      fromDate,
      toDate,
      deploymentResult.source
    );

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Error calculating DORA metrics:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to calculate DORA metrics", details: message },
      { status: 500 }
    );
  }
}
