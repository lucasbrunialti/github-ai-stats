import { NextRequest, NextResponse } from "next/server";
import { testSlackWebhook } from "@/services/slack";
import { APIError } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: boolean } | APIError>> {
  try {
    const body = await request.json();
    const { webhookUrl } = body;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Missing required field: webhookUrl" },
        { status: 400 }
      );
    }

    const result = await testSlackWebhook(webhookUrl);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send test message", details: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error testing webhook:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to test webhook", details: message },
      { status: 500 }
    );
  }
}
