
import "dotenv/config";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API = "https://api.github.com";

export async function getRepositoryDetails(repoUrl: string) {
  if (typeof repoUrl !== "string" || !repoUrl.trim()) {
    throw new Error("GitHub repository URL is required.");
  }

  let url;

  try {
    url = new URL(repoUrl.trim());
  } catch {
    throw new Error("Invalid GitHub repository URL.");
  }

  if (
    url.hostname !== "github.com" ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error("Please provide a valid HTTPS GitHub repository URL.");
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (
    parts.length !== 2 ||
    parts.some((part) => !/^[a-zA-Z0-9_.-]+$/.test(part))
  ) {
    throw new Error(
      "Expected a repository URL like https://github.com/owner/repo"
    );
  }

  const [owner, rawRepo] = parts;
  const repo = rawRepo.replace(/\.git$/i, "");

  if (!repo) {
    throw new Error("Repository name is required.");
  }

 


 async function githubGet(url: string) {
  const path = url.startsWith("https://")
    ? url
    : `${GITHUB_API}${url.startsWith("/") ? "" : "/"}${url}`;
  const response = await fetch(path, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(GITHUB_TOKEN && {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      }),
    },
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `GitHub API error ${response.status}: ${body}`
    );
  }

  return response.json();
}

  // Get repository metadata.
  const repository = await githubGet(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  );

  if (repository.private) {
    throw new Error(
      "This repository is private. Only public repositories are supported."
    );
  }

  // Get the latest commit on the default branch.
  const commit = await githubGet(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(repository.default_branch)}`
  );

  return {
    githubRepoId: repository.id,
    owner: repository.owner.login,
    repo: repository.name,
    canonicalUrl: repository.html_url,
    defaultBranch: repository.default_branch,
    commitSha: commit.sha,
  };
}
