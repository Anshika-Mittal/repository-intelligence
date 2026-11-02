const GITHUB_API = "https://api.github.com";

function parseGitHubRepoUrl(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("GitHub repository URL is required.");
  }

  let url;

  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Invalid URL format.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "URL must use https://github.com."
    );
  }

  // Remove trailing slash and optional .git suffix.
  const parts = url.pathname
    .split("/")
    .filter(Boolean);

  if (parts.length < 2) {
    throw new Error(
      "URL must include both owner and repository name."
    );
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");

  // Reject extra paths other than a branch/tree path.
  if (
    parts.length > 2 &&
    !["tree", "blob"].includes(parts[2])
  ) {
    throw new Error(
      "Unsupported GitHub URL path."
    );
  }

  if (parts.length > 2 && parts.length < 4) {
    throw new Error(
      "Branch or file path is incomplete."
    );
  }

  if (
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) ||
    !/^[A-Za-z0-9_.-]+$/.test(repo) ||
    repo === "." ||
    repo === ".."
  ) {
    throw new Error(
      "Invalid GitHub owner or repository name."
    );
  }

  return { owner, repo };
}

export async function getRepositoryStructure(repoUrl) {
  const { owner, repo } = parseGitHubRepoUrl(repoUrl);

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Repository-Intelligence-Agent",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization =
      `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const repoResponse = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers }
  );

  if (!repoResponse.ok) {
    if (repoResponse.status === 404) {
      throw new Error(
        "Repository not found or inaccessible. Check the URL and repository permissions."
      );
    }

    if (repoResponse.status === 401) {
      throw new Error("GitHub authentication failed.");
    }

    if (repoResponse.status === 403) {
      throw new Error(
        "GitHub API access forbidden or rate limit exceeded."
      );
    }

    throw new Error(
      `GitHub API error ${repoResponse.status}: ${await repoResponse.text()}`
    );
  }

  const repository = await repoResponse.json();

  if (repository.empty) {
    return {
      owner,
      repo,
      defaultBranch: repository.default_branch,
      tree: [],
      truncated: false,
    };
  }

  const branch = repository.default_branch;

  const treeResponse = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers }
  );

  if (!treeResponse.ok) {
    throw new Error(
      `Failed to fetch repository tree: HTTP ${treeResponse.status}`
    );
  }

  const treeData = await treeResponse.json();

  return {
    owner,
    repo,
    defaultBranch: branch,
    truncated: treeData.truncated,
    tree: treeData.tree.map((item) => ({
      path: item.path,
      type: item.type === "tree" ? "directory" : item.type,
      sha: item.sha,
      size: item.size ?? null,
    })),
  };
}

