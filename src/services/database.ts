import { prisma } from "@/lib/prisma";
import { PullRequest } from "@/types";

export async function saveOrganization(name: string) {
  return prisma.organization.upsert({
    where: { name },
    update: { updatedAt: new Date() },
    create: { name },
  });
}

export async function saveRepository(orgId: string, name: string, fullName: string) {
  return prisma.repository.upsert({
    where: { fullName },
    update: { updatedAt: new Date() },
    create: {
      name,
      fullName,
      organizationId: orgId,
    },
  });
}

export async function saveDeveloper(username: string, avatarUrl?: string) {
  return prisma.developer.upsert({
    where: { username },
    update: { avatarUrl, updatedAt: new Date() },
    create: { username, avatarUrl },
  });
}

export async function savePullRequests(org: string, prs: PullRequest[]) {
  // First, ensure organization exists
  const organization = await saveOrganization(org);

  for (const pr of prs) {
    // Ensure repository exists
    const repository = await saveRepository(
      organization.id,
      pr.repo,
      `${org}/${pr.repo}`
    );

    // Ensure developer exists
    const developer = await saveDeveloper(pr.author);

    // Upsert pull request
    const pullRequest = await prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId: repository.id,
          number: pr.number,
        },
      },
      update: {
        title: pr.title,
        description: pr.description,
        url: pr.url,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        mergedAt: new Date(pr.mergedAt),
        developerId: developer.id,
        updatedAt: new Date(),
      },
      create: {
        number: pr.number,
        title: pr.title,
        description: pr.description,
        url: pr.url,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        mergedAt: new Date(pr.mergedAt),
        repositoryId: repository.id,
        developerId: developer.id,
      },
    });

    // Save commits
    for (const commit of pr.commits) {
      await prisma.commit.upsert({
        where: {
          pullRequestId_sha: {
            pullRequestId: pullRequest.id,
            sha: commit.sha,
          },
        },
        update: {
          message: commit.message,
          author: commit.author,
          date: commit.date ? new Date(commit.date) : new Date(),
        },
        create: {
          sha: commit.sha,
          message: commit.message,
          author: commit.author,
          date: commit.date ? new Date(commit.date) : new Date(),
          pullRequestId: pullRequest.id,
        },
      });
    }
  }
}

export interface DeveloperPRStats {
  developer: string;
  month: string;
  prCount: number;
  additions: number;
  deletions: number;
}

export async function getDeveloperStats(
  orgName?: string,
  fromDate?: string,
  toDate?: string,
  developerUsername?: string
): Promise<DeveloperPRStats[]> {
  const where: Record<string, unknown> = {};

  if (fromDate || toDate) {
    where.mergedAt = {};
    if (fromDate) {
      (where.mergedAt as Record<string, Date>).gte = new Date(fromDate);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      (where.mergedAt as Record<string, Date>).lte = to;
    }
  }

  if (developerUsername) {
    where.developer = { username: developerUsername };
  }

  if (orgName) {
    where.repository = {
      organization: { name: orgName },
    };
  }

  const prs = await prisma.pullRequest.findMany({
    where,
    include: {
      developer: true,
    },
    orderBy: {
      mergedAt: "asc",
    },
  });

  // Group by developer and month
  const statsMap = new Map<string, DeveloperPRStats>();

  for (const pr of prs) {
    const month = pr.mergedAt.toISOString().slice(0, 7); // YYYY-MM
    const key = `${pr.developer.username}-${month}`;

    if (!statsMap.has(key)) {
      statsMap.set(key, {
        developer: pr.developer.username,
        month,
        prCount: 0,
        additions: 0,
        deletions: 0,
      });
    }

    const stats = statsMap.get(key)!;
    stats.prCount += 1;
    stats.additions += pr.additions;
    stats.deletions += pr.deletions;
  }

  return Array.from(statsMap.values()).sort((a, b) => {
    if (a.month !== b.month) {
      return a.month.localeCompare(b.month);
    }
    return a.developer.localeCompare(b.developer);
  });
}

export async function getAllDevelopers() {
  return prisma.developer.findMany({
    orderBy: { username: "asc" },
  });
}

export async function getAllOrganizations() {
  return prisma.organization.findMany({
    orderBy: { name: "asc" },
  });
}
