import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APIError } from "@/types";

export interface ReportConfigResponse {
  id: string;
  name: string;
  organizationName: string;
  slackWebhookUrl: string;
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
  weeklySchedule: string;
  monthlySchedule: string;
  isActive: boolean;
  lastWeeklyRun: string | null;
  lastMonthlyRun: string | null;
}

export async function GET(): Promise<NextResponse<{ configs: ReportConfigResponse[] } | APIError>> {
  try {
    const configs = await prisma.reportConfig.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      configs: configs.map((c) => ({
        id: c.id,
        name: c.name,
        organizationName: c.organizationName,
        slackWebhookUrl: c.slackWebhookUrl,
        weeklyEnabled: c.weeklyEnabled,
        monthlyEnabled: c.monthlyEnabled,
        weeklySchedule: c.weeklySchedule,
        monthlySchedule: c.monthlySchedule,
        isActive: c.isActive,
        lastWeeklyRun: c.lastWeeklyRun?.toISOString() || null,
        lastMonthlyRun: c.lastMonthlyRun?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching report configs:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch report configs", details: message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ config: ReportConfigResponse } | APIError>> {
  try {
    const body = await request.json();
    const {
      name,
      organizationName,
      slackWebhookUrl,
      weeklyEnabled = true,
      monthlyEnabled = true,
      weeklySchedule = "0 9 * * 1",
      monthlySchedule = "0 9 1 * *",
    } = body;

    if (!name || !organizationName || !slackWebhookUrl) {
      return NextResponse.json(
        { error: "Missing required fields: name, organizationName, slackWebhookUrl" },
        { status: 400 }
      );
    }

    const config = await prisma.reportConfig.create({
      data: {
        name,
        organizationName,
        slackWebhookUrl,
        weeklyEnabled,
        monthlyEnabled,
        weeklySchedule,
        monthlySchedule,
      },
    });

    return NextResponse.json({
      config: {
        id: config.id,
        name: config.name,
        organizationName: config.organizationName,
        slackWebhookUrl: config.slackWebhookUrl,
        weeklyEnabled: config.weeklyEnabled,
        monthlyEnabled: config.monthlyEnabled,
        weeklySchedule: config.weeklySchedule,
        monthlySchedule: config.monthlySchedule,
        isActive: config.isActive,
        lastWeeklyRun: config.lastWeeklyRun?.toISOString() || null,
        lastMonthlyRun: config.lastMonthlyRun?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error creating report config:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create report config", details: message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse<{ config: ReportConfigResponse } | APIError>> {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const config = await prisma.reportConfig.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      config: {
        id: config.id,
        name: config.name,
        organizationName: config.organizationName,
        slackWebhookUrl: config.slackWebhookUrl,
        weeklyEnabled: config.weeklyEnabled,
        monthlyEnabled: config.monthlyEnabled,
        weeklySchedule: config.weeklySchedule,
        monthlySchedule: config.monthlySchedule,
        isActive: config.isActive,
        lastWeeklyRun: config.lastWeeklyRun?.toISOString() || null,
        lastMonthlyRun: config.lastMonthlyRun?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error updating report config:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update report config", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<{ success: boolean } | APIError>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    await prisma.reportConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report config:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to delete report config", details: message },
      { status: 500 }
    );
  }
}
