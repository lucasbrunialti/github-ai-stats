import { prisma } from "@/lib/prisma";
import { generateSummary } from "./claude";
import { sendSlackMessage, formatReportForSlack } from "./slack";
import { PullRequest } from "@/types";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
} from "date-fns";

interface ReportResult {
  success: boolean;
  summary?: string;
  error?: string;
  stats?: {
    totalPRs: number;
    totalDevelopers: number;
    totalAdditions: number;
    totalDeletions: number;
  };
}

export async function generateReportForPeriod(
  orgName: string,
  fromDate: Date,
  toDate: Date
): Promise<ReportResult> {
  try {
    // Get organization
    const org = await prisma.organization.findUnique({
      where: { name: orgName },
    });

    if (!org) {
      return { success: false, error: `Organization ${orgName} not found` };
    }

    // Get PRs in the date range
    const prs = await prisma.pullRequest.findMany({
      where: {
        repository: {
          organizationId: org.id,
        },
        mergedAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        repository: true,
        developer: true,
        commits: true,
      },
    });

    if (prs.length === 0) {
      return {
        success: true,
        summary: "No pull requests were merged during this period.",
        stats: {
          totalPRs: 0,
          totalDevelopers: 0,
          totalAdditions: 0,
          totalDeletions: 0,
        },
      };
    }

    // Convert to the format expected by Claude service
    const formattedPRs: PullRequest[] = prs.map((pr) => ({
      repo: pr.repository.name,
      number: pr.number,
      title: pr.title,
      description: pr.description,
      author: pr.developer.username,
      mergedAt: pr.mergedAt.toISOString(),
      commits: pr.commits.map((c) => ({
        sha: c.sha,
        message: c.message,
        author: c.author,
        date: c.date.toISOString(),
      })),
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changedFiles,
      url: pr.url,
    }));

    // Calculate stats
    const uniqueDevelopers = new Set(prs.map((pr) => pr.developer.username));
    const stats = {
      totalPRs: prs.length,
      totalDevelopers: uniqueDevelopers.size,
      totalAdditions: prs.reduce((sum, pr) => sum + pr.additions, 0),
      totalDeletions: prs.reduce((sum, pr) => sum + pr.deletions, 0),
    };

    // Generate AI summary
    const fromDateStr = format(fromDate, "yyyy-MM-dd");
    const toDateStr = format(toDate, "yyyy-MM-dd");

    const result = await generateSummary(
      orgName,
      formattedPRs,
      fromDateStr,
      toDateStr
    );

    return {
      success: true,
      summary: result.summary,
      stats,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function generateWeeklyReport(
  configId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await prisma.reportConfig.findUnique({
      where: { id: configId },
    });

    if (!config || !config.isActive) {
      return { success: false, error: "Config not found or inactive" };
    }

    // Calculate last week's date range
    const now = new Date();
    const lastWeek = subWeeks(now, 1);
    const fromDate = startOfWeek(lastWeek, { weekStartsOn: 1 }); // Monday
    const toDate = endOfWeek(lastWeek, { weekStartsOn: 1 }); // Sunday

    console.log(
      `Generating weekly report for ${config.organizationName}: ${format(fromDate, "yyyy-MM-dd")} to ${format(toDate, "yyyy-MM-dd")}`
    );

    const result = await generateReportForPeriod(
      config.organizationName,
      fromDate,
      toDate
    );

    if (!result.success) {
      await logReport(configId, "weekly", "failed", undefined, result.error);
      return { success: false, error: result.error };
    }

    // Send to Slack
    const slackMessage = formatReportForSlack(
      "weekly",
      config.organizationName,
      format(fromDate, "yyyy-MM-dd"),
      format(toDate, "yyyy-MM-dd"),
      result.summary || "",
      result.stats!
    );

    const slackResult = await sendSlackMessage(
      config.slackWebhookUrl,
      slackMessage
    );

    if (!slackResult.success) {
      await logReport(configId, "weekly", "failed", undefined, slackResult.error);
      return { success: false, error: slackResult.error };
    }

    // Update last run time
    await prisma.reportConfig.update({
      where: { id: configId },
      data: { lastWeeklyRun: now },
    });

    await logReport(configId, "weekly", "success", result.summary);

    console.log(`Weekly report sent successfully for ${config.organizationName}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logReport(configId, "weekly", "failed", undefined, message);
    return { success: false, error: message };
  }
}

export async function generateMonthlyReport(
  configId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await prisma.reportConfig.findUnique({
      where: { id: configId },
    });

    if (!config || !config.isActive) {
      return { success: false, error: "Config not found or inactive" };
    }

    // Calculate last month's date range
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const fromDate = startOfMonth(lastMonth);
    const toDate = endOfMonth(lastMonth);

    console.log(
      `Generating monthly report for ${config.organizationName}: ${format(fromDate, "yyyy-MM-dd")} to ${format(toDate, "yyyy-MM-dd")}`
    );

    const result = await generateReportForPeriod(
      config.organizationName,
      fromDate,
      toDate
    );

    if (!result.success) {
      await logReport(configId, "monthly", "failed", undefined, result.error);
      return { success: false, error: result.error };
    }

    // Send to Slack
    const slackMessage = formatReportForSlack(
      "monthly",
      config.organizationName,
      format(fromDate, "yyyy-MM-dd"),
      format(toDate, "yyyy-MM-dd"),
      result.summary || "",
      result.stats!
    );

    const slackResult = await sendSlackMessage(
      config.slackWebhookUrl,
      slackMessage
    );

    if (!slackResult.success) {
      await logReport(configId, "monthly", "failed", undefined, slackResult.error);
      return { success: false, error: slackResult.error };
    }

    // Update last run time
    await prisma.reportConfig.update({
      where: { id: configId },
      data: { lastMonthlyRun: now },
    });

    await logReport(configId, "monthly", "success", result.summary);

    console.log(`Monthly report sent successfully for ${config.organizationName}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logReport(configId, "monthly", "failed", undefined, message);
    return { success: false, error: message };
  }
}

async function logReport(
  configId: string,
  reportType: "weekly" | "monthly",
  status: "success" | "failed",
  summary?: string,
  error?: string
) {
  await prisma.reportLog.create({
    data: {
      configId,
      reportType,
      status,
      summary: summary?.slice(0, 5000), // Limit size
      error,
    },
  });
}

export async function getActiveReportConfigs() {
  return prisma.reportConfig.findMany({
    where: { isActive: true },
  });
}
