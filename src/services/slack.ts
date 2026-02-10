interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: string;
    emoji?: boolean;
  }>;
}

interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

export async function sendSlackMessage(
  webhookUrl: string,
  message: SlackMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Slack API error: ${text}` };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export function formatReportForSlack(
  reportType: "weekly" | "monthly",
  orgName: string,
  fromDate: string,
  toDate: string,
  summary: string,
  stats: {
    totalPRs: number;
    totalDevelopers: number;
    totalAdditions: number;
    totalDeletions: number;
  }
): SlackMessage {
  const periodLabel = reportType === "weekly" ? "Weekly" : "Monthly";
  const emoji = reportType === "weekly" ? ":calendar:" : ":date:";

  // Convert markdown to Slack-friendly format (basic conversion)
  const slackSummary = summary
    .replace(/^### /gm, "*")
    .replace(/^## /gm, "*")
    .replace(/^# /gm, "*")
    .replace(/\*\*/g, "*")
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .slice(0, 2500); // Slack has limits

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} ${periodLabel} Engineering Report - ${orgName}`,
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "plain_text",
          text: `Period: ${fromDate} to ${toDate}`,
          emoji: true,
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Key Metrics*\n:merged: PRs Merged: *${stats.totalPRs}*\n:busts_in_silhouette: Active Developers: *${stats.totalDevelopers}*\n:heavy_plus_sign: Lines Added: *+${stats.totalAdditions.toLocaleString()}*\n:heavy_minus_sign: Lines Removed: *-${stats.totalDeletions.toLocaleString()}*`,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: slackSummary,
      },
    },
  ];

  return {
    text: `${periodLabel} Engineering Report for ${orgName} (${fromDate} to ${toDate})`,
    blocks,
  };
}

export async function testSlackWebhook(
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  const testMessage: SlackMessage = {
    text: "GitHub AI Stats - Test Message",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":white_check_mark: *Slack webhook configured successfully!*\n\nYou will receive weekly and monthly engineering reports through this channel.",
        },
      },
    ],
  };

  return sendSlackMessage(webhookUrl, testMessage);
}
