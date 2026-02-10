import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import {
  generateWeeklyReport,
  generateMonthlyReport,
} from "../services/report-generator";

const prisma = new PrismaClient();

interface ScheduledTask {
  configId: string;
  type: "weekly" | "monthly";
  task: cron.ScheduledTask;
}

const scheduledTasks: ScheduledTask[] = [];

async function loadAndScheduleReports() {
  console.log("Loading report configurations...");

  // Clear existing tasks
  for (const task of scheduledTasks) {
    task.task.stop();
  }
  scheduledTasks.length = 0;

  // Load active configs
  const configs = await prisma.reportConfig.findMany({
    where: { isActive: true },
  });

  console.log(`Found ${configs.length} active report configuration(s)`);

  for (const config of configs) {
    // Schedule weekly report
    if (config.weeklyEnabled && cron.validate(config.weeklySchedule)) {
      const weeklyTask = cron.schedule(config.weeklySchedule, async () => {
        console.log(`Running weekly report for ${config.organizationName}...`);
        const result = await generateWeeklyReport(config.id);
        if (!result.success) {
          console.error(`Weekly report failed: ${result.error}`);
        }
      });

      scheduledTasks.push({
        configId: config.id,
        type: "weekly",
        task: weeklyTask,
      });

      console.log(
        `Scheduled weekly report for ${config.organizationName} (${config.weeklySchedule})`
      );
    }

    // Schedule monthly report
    if (config.monthlyEnabled && cron.validate(config.monthlySchedule)) {
      const monthlyTask = cron.schedule(config.monthlySchedule, async () => {
        console.log(`Running monthly report for ${config.organizationName}...`);
        const result = await generateMonthlyReport(config.id);
        if (!result.success) {
          console.error(`Monthly report failed: ${result.error}`);
        }
      });

      scheduledTasks.push({
        configId: config.id,
        type: "monthly",
        task: monthlyTask,
      });

      console.log(
        `Scheduled monthly report for ${config.organizationName} (${config.monthlySchedule})`
      );
    }
  }
}

async function main() {
  console.log("===========================================");
  console.log("  GitHub AI Stats - Report Scheduler");
  console.log("===========================================");
  console.log("");

  await loadAndScheduleReports();

  // Reload configs every hour to pick up changes
  cron.schedule("0 * * * *", async () => {
    console.log("Reloading report configurations...");
    await loadAndScheduleReports();
  });

  console.log("");
  console.log("Scheduler is running. Press Ctrl+C to stop.");
  console.log("");
  console.log("Cron schedule format: minute hour day-of-month month day-of-week");
  console.log("Examples:");
  console.log("  0 9 * * 1    = Every Monday at 9:00 AM");
  console.log("  0 9 1 * *    = 1st of every month at 9:00 AM");
  console.log("");

  // Keep process running
  process.on("SIGINT", async () => {
    console.log("\nStopping scheduler...");
    for (const task of scheduledTasks) {
      task.task.stop();
    }
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch(async (error) => {
  console.error("Scheduler error:", error);
  await prisma.$disconnect();
  process.exit(1);
});
