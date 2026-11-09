// services/github/githubClient.js

const GITHUB_API = "https://api.github.com";

function parseGitHubRepoUrl(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("GitHub repository URL is required.");
  }

  let url;

  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Invalid GitHub repository URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new Error("Only HTTPS GitHub repository URLs are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length < 2) {
    throw new Error("GitHub URL must contain owner and repository.");
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");

  // This function accepts repository root URLs only.
  if (parts.length > 2) {
    throw new Error(
      "Please provide the repository root URL, not a file or branch URL."
    );
  }

  if (
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) ||
    !/^[A-Za-z0-9_.-]+$/.test(repo) ||
    repo === "." ||
    repo === ".."
  ) {
    throw new Error("Invalid GitHub owner or repository name.");
  }

  return { owner, repo };
}

/**
 * Make an authenticated request to GitHub.
 */
async function githubRequest(endpoint) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Repository-Intelligence-Agent",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API}${endpoint}`, { headers });

  if (!response.ok) {
    const errorBody = await response.text();

    if (response.status === 404) {
      throw new Error(
        "GitHub repository or resource not found or inaccessible."
      );
    }

    if (response.status === 401) {
      throw new Error("GitHub authentication failed.");
    }

    if (response.status === 403 || response.status === 429) {
      throw new Error(
        `GitHub API rate limit exceeded or access forbidden: ${errorBody}`
      );
    }

    throw new Error(
      `GitHub API error ${response.status}: ${errorBody}`
    );
  }

  return response.json();
}

/**
 * Get the complete repository tree.
 *
 * Uses the recursive Git Trees API first.
 * If GitHub truncates the response, traverses individual
 * directory trees using their SHA values.
 */
async function fetchCompleteTree(owner, repo, rootTreeSha) {
  const endpoint =
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
    `/git/trees/${encodeURIComponent(rootTreeSha)}?recursive=1`;

  const result = await githubRequest(endpoint);

  if (!result.truncated) {
    return result.tree;
  }

  // Fallback for repositories whose recursive tree exceeds
  // GitHub's response limit.
  const allItems = [];
  const queue = [{ sha: rootTreeSha, prefix: "" }];

  while (queue.length > 0) {
    const current = queue.shift();

    const directoryTree = await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
      `/git/trees/${encodeURIComponent(current.sha)}`
    );

    for (const item of directoryTree.tree) {
      const fullPath = current.prefix
        ? `${current.prefix}/${item.path}`
        : item.path;

      allItems.push({
        ...item,
        path: fullPath,
      });

      if (item.type === "tree") {
        queue.push({
          sha: item.sha,
          prefix: fullPath,
        });
      }
    }
  }

  return allItems;
}

/**
 * Get repository structure directly from GitHub.
 */
export async function getRepositoryStructure(repoUrl) {
  const { owner, repo } = parseGitHubRepoUrl(repoUrl);

  // STEP 1: Get repository metadata.
  const repository = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  );

  // Reject private repositories.
  if (repository.private) {
    throw new Error("Private repositories are not supported.");
  }

  if (!repository.default_branch) {
    throw new Error("Repository has no default branch.");
  }

  // STEP 2: Get the latest default branch commit.
  const branch = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
    `/branches/${encodeURIComponent(repository.default_branch)}`
  );

  const commitSha = branch.commit.sha;
  const rootTreeSha = branch.commit.commit.tree.sha;

  // STEP 3: Fetch the complete repository tree.
  const rawTree = await fetchCompleteTree(
    owner,
    repo,
    rootTreeSha
  );

  // STEP 4: Format the tree.
  const tree = rawTree
    .map((item) => ({
      path: item.path,
      name: item.path.split("/").pop(),
      type:
        item.type === "tree"
          ? "directory"
          : item.type === "commit"
            ? "submodule"
            : item.mode === "120000"
              ? "symlink"
              : "file",
      sha: item.sha,
      size: item.size ?? null,
      mode: item.mode,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  // STEP 5: Return structured repository information.
  const files = tree.filter((item) => item.type !== "directory");
  const directories = tree.filter(
    (item) => item.type === "directory"
  );

  return {
    source: "github",
    repository: repository.full_name,
    owner,
    repo,
    defaultBranch: repository.default_branch,
    commitSha,
    rootTreeSha,
    totalFiles: files.length,
    totalDirectories: directories.length,
    truncated: false,
    files,
    directories,
    tree,
  };
}