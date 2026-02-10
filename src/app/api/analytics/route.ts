import { NextRequest, NextResponse } from "next/server";
import {
  getDeveloperStats,
  getAllDevelopers,
  getAllOrganizations,
} from "@/services/database";
import { APIError } from "@/types";

export interface AnalyticsResponse {
  stats: {
    developer: string;
    month: string;
    prCount: number;
    additions: number;
    deletions: number;
  }[];
  developers: { id: string; username: string }[];
  organizations: { id: string; name: string }[];
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<AnalyticsResponse | APIError>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const org = searchParams.get("org") || undefined;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;
    const developer = searchParams.get("developer") || undefined;

    const [stats, developers, organizations] = await Promise.all([
      getDeveloperStats(org, fromDate, toDate, developer),
      getAllDevelopers(),
      getAllOrganizations(),
    ]);

    return NextResponse.json({
      stats,
      developers: developers.map((d) => ({ id: d.id, username: d.username })),
      organizations: organizations.map((o) => ({ id: o.id, name: o.name })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch analytics", details: message },
      { status: 500 }
    );
  }
}
