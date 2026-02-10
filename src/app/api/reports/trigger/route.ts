import { NextRequest, NextResponse } from "next/server";
import {
  generateWeeklyReport,
  generateMonthlyReport,
} from "@/services/report-generator";
import { APIError } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; message: string } | APIError>> {
  try {
    const body = await request.json();
    const { configId, reportType } = body;

    if (!configId || !reportType) {
      return NextResponse.json(
        { error: "Missing required fields: configId, reportType" },
        { status: 400 }
      );
    }

    if (reportType !== "weekly" && reportType !== "monthly") {
      return NextResponse.json(
        { error: "reportType must be 'weekly' or 'monthly'" },
        { status: 400 }
      );
    }

    let result;
    if (reportType === "weekly") {
      result = await generateWeeklyReport(configId);
    } else {
      result = await generateMonthlyReport(configId);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to generate report", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${reportType} report sent successfully`,
    });
  } catch (error) {
    console.error("Error triggering report:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to trigger report", details: message },
      { status: 500 }
    );
  }
}
