import { NextRequest, NextResponse } from "next/server";
import { getMergedPRs } from "@/services/github";
import { savePullRequests } from "@/services/database";
import { PRsResponse, APIError } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<PRsResponse | APIError>> {
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

    const prs = await getMergedPRs(org, repos, fromDate, toDate);

    // Save PRs to database for analytics
    if (prs.length > 0) {
      try {
        await savePullRequests(org, prs);
      } catch (dbError) {
        console.error("Error saving PRs to database:", dbError);
        // Don't fail the request if DB save fails
      }
    }

    return NextResponse.json({
      totalPRs: prs.length,
      prs,
    });
  } catch (error) {
    console.error("Error fetching PRs:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch pull requests", details: message },
      { status: 500 }
    );
  }
}
