import { Octokit } from "@octokit/rest";
import { Repository, PullRequest, Commit, Deployment } from "@/types";
import { isDateInRange } from "@/lib/utils";

let octokitInstance: Octokit | null = null;

function getOctokit(): Octokit {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  if (!octokitInstance) {
    octokitInstance = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  return octokitInstance;
}

export async function getOrganizationRepos(org: string): Promise<Repository[]> {
  const octokit = getOctokit();
  const repos: Repository[] = [];

  try {
    // Try to get org repos first
    const iterator = octokit.paginate.iterator(octokit.rest.repos.listForOrg, {
      org,
      per_page: 100,
      sort: "updated",
      direction: "desc",
    });

    for await (const { data } of iterator) {
      for (const repo of data) {
        repos.push({
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          private: repo.private,
          defaultBranch: repo.default_branch,
          updatedAt: repo.updated_at || "",
        });
      }
    }
  } catch (error: unknown) {
    // If org repos fail, try user repos (for personal accounts)
    const octokitError = error as { status?: number };
    if (octokitError.status === 404) {
      const iterator = octokit.paginate.iterator(
        octokit.rest.repos.listForUser,
        {
          username: org,
          per_page: 100,
          sort: "updated",
          direction: "desc",
        }
      );

      for await (const { data } of iterator) {
        for (const repo of data) {
          repos.push({
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            private: repo.private,
            defaultBranch: repo.default_branch,
            updatedAt: repo.updated_at || "",
          });
        }
      }
    } else {
      throw error;
    }
  }

  return repos;
}

export async function getPRCommits(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<Commit[]> {
  const octokit = getOctokit();
  const commits: Commit[] = [];

  try {
    const { data } = await octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    });

    for (const commit of data) {
      commits.push({
        sha: commit.sha,
        message: commit.commit.message.split("\n")[0], // First line only
        author: commit.author?.login || commit.commit.author?.name || "unknown",
        date: commit.commit.author?.date || "",
      });
    }
  } catch (error) {
    console.error(`Failed to get commits for PR #${pullNumber}:`, error);
  }

  return commits;
}

export async function getMergedPRs(
  org: string,
  repoNames: string[],
  fromDate: string,
  toDate: string,
  onProgress?: (current: number, total: number, repoName: string) => void
): Promise<PullRequest[]> {
  const octokit = getOctokit();
  const allPRs: PullRequest[] = [];

  let current = 0;
  const total = repoNames.length;

  for (const repoName of repoNames) {
    current++;
    onProgress?.(current, total, repoName);

    try {
      const iterator = octokit.paginate.iterator(octokit.rest.pulls.list, {
        owner: org,
        repo: repoName,
        state: "closed",
        sort: "updated",
        direction: "desc",
        per_page: 100,
      });

      let foundOldPR = false;

      for await (const { data } of iterator) {
        for (const pr of data) {
          // Skip if not merged
          if (!pr.merged_at) continue;

          // Check if PR is in date range
          if (!isDateInRange(pr.merged_at, fromDate, toDate)) {
            // If PR is older than fromDate, we can stop paginating
            const prDate = new Date(pr.merged_at);
            const from = new Date(fromDate);
            if (prDate < from) {
              foundOldPR = true;
              break;
            }
            continue;
          }

          // Get commits for this PR
          const commits = await getPRCommits(org, repoName, pr.number);

          allPRs.push({
            repo: repoName,
            number: pr.number,
            title: pr.title,
            description: pr.body,
            author: pr.user?.login || "unknown",
            createdAt: pr.created_at,
            mergedAt: pr.merged_at,
            commits,
            additions: pr.additions || 0,
            deletions: pr.deletions || 0,
            changedFiles: pr.changed_files || 0,
            url: pr.html_url,
          });
        }

        if (foundOldPR) break;
      }
    } catch (error) {
      console.error(`Failed to get PRs for ${repoName}:`, error);
    }
  }

  // Sort by merged date descending
  allPRs.sort(
    (a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime()
  );

  return allPRs;
}

export async function getRepoDeployments(
  org: string,
  repoName: string,
  fromDate: string,
  toDate: string
): Promise<Deployment[]> {
  const octokit = getOctokit();
  const deployments: Deployment[] = [];
  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  try {
    const iterator = octokit.paginate.iterator(
      octokit.rest.repos.listDeployments,
      {
        owner: org,
        repo: repoName,
        per_page: 100,
      }
    );

    for await (const { data } of iterator) {
      let foundOld = false;
      for (const dep of data) {
        const depDate = new Date(dep.created_at);
        if (depDate < from) {
          foundOld = true;
          break;
        }
        if (depDate <= to) {
          deployments.push({
            id: dep.id,
            environment: dep.environment,
            createdAt: dep.created_at,
            repo: repoName,
            ref: dep.ref,
            description: dep.description,
          });
        }
      }
      if (foundOld) break;
    }
  } catch (error) {
    console.error(`Failed to get deployments for ${repoName}:`, error);
  }

  return deployments;
}

export async function getRepoReleases(
  org: string,
  repoName: string,
  fromDate: string,
  toDate: string
): Promise<Deployment[]> {
  const octokit = getOctokit();
  const releases: Deployment[] = [];
  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  try {
    const iterator = octokit.paginate.iterator(
      octokit.rest.repos.listReleases,
      {
        owner: org,
        repo: repoName,
        per_page: 100,
      }
    );

    for await (const { data } of iterator) {
      let foundOld = false;
      for (const release of data) {
        if (release.draft) continue;
        const releaseDate = new Date(release.published_at || release.created_at);
        if (releaseDate < from) {
          foundOld = true;
          break;
        }
        if (releaseDate <= to) {
          releases.push({
            id: release.id,
            environment: "production",
            createdAt: release.published_at || release.created_at,
            repo: repoName,
            ref: release.tag_name,
            description: release.name,
          });
        }
      }
      if (foundOld) break;
    }
  } catch (error) {
    console.error(`Failed to get releases for ${repoName}:`, error);
  }

  return releases;
}

export async function getDeploymentsForRepos(
  org: string,
  repoNames: string[],
  fromDate: string,
  toDate: string
): Promise<{ deployments: Deployment[]; source: "deployments" | "releases" | "pull_requests" }> {
  let allDeployments: Deployment[] = [];

  // Try GitHub Deployments API first
  for (const repoName of repoNames) {
    const deps = await getRepoDeployments(org, repoName, fromDate, toDate);
    allDeployments.push(...deps);
  }

  if (allDeployments.length > 0) {
    allDeployments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { deployments: allDeployments, source: "deployments" };
  }

  // Fallback to Releases API
  for (const repoName of repoNames) {
    const releases = await getRepoReleases(org, repoName, fromDate, toDate);
    allDeployments.push(...releases);
  }

  if (allDeployments.length > 0) {
    allDeployments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { deployments: allDeployments, source: "releases" };
  }

  // No deployments or releases found — will use PRs as proxy
  return { deployments: [], source: "pull_requests" };
}
