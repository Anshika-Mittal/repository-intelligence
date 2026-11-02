const GITHUB_API = "https://api.github.com";

export function parseGitHubRepoUrl(input) {
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
    throw new Error("URL must use https://github.com.");
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(parts[0]) ||
    !/^[A-Za-z0-9_.-]+$/.test(parts[1]) ||
    parts[1] === "." ||
    parts[1] === ".."
  ) {
    throw new Error(
      "Provide a valid GitHub repository URL, without a branch or file path."
    );
  }

  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/i, ""),
  };
}

async function githubRequest(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Repository-Intelligence-Agent",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API}${path}`, { headers });

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

async function mapWithConcurrency(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;

      if (index >= items.length) return;

      results[index] = await callback(items[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(limit, items.length) },
      () => worker()
    )
  );

  return results;
}

function shouldIncludeFile(path) {
  const excluded = [
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage",
    "vendor",
    "__pycache__",
  ];

  if (path.split("/").some((part) => excluded.includes(part))) {
    return false;
  }

  return /\.(js|jsx|ts|tsx|mjs|cjs|py|java|c|h|cpp|go|rs|php|rb|html|css|scss|json|md|mdx|txt|yml|yaml|toml|xml|sql|sh)$/i.test(path);
}

function getLanguage(path) {
  const extension = path.split(".").pop().toLowerCase();

  const languages = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    cpp: "cpp",
    go: "go",
    rs: "rust",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    sql: "sql",
  };

  return languages[extension] || "text";
}

export async function getRepositorySnapshot(repoUrl) {
  const { owner, repo } = parseGitHubRepoUrl(repoUrl);

  // 1. Get repository ID and default branch.
  const repository = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  );

  const repositoryId = String(repository.id);

  if (!repository.default_branch) {
    throw new Error("Repository is empty or has no default branch.");
  }

  // 2. Resolve the default branch to an exact commit.
  const commit = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
      `/commits/${encodeURIComponent(repository.default_branch)}`
  );

  const commitSha = commit.sha;

  // 3. Fetch the tree belonging to that exact commit.
  const tree = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
      `/git/trees/${encodeURIComponent(commitSha)}?recursive=1`
  );

  if (tree.truncated) {
    throw new Error(
      "Repository tree is too large; recursive results were truncated."
    );
  }

  const blobs = tree.tree.filter(
    (item) =>
      item.type === "blob" &&
      item.size <= 1024 * 1024 &&
      shouldIncludeFile(item.path)
  );

  if (blobs.length > 5000) {
    throw new Error("Repository exceeds the 5000-file processing limit.");
  }

  // 4. Fetch file contents at the resolved commit.
  const files = (
    await mapWithConcurrency(blobs, 5, async (blob) => {
      const result = await githubRequest(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
          `/git/blobs/${encodeURIComponent(blob.sha)}`
      );

      if (result.encoding !== "base64") {
        throw new Error(`Unexpected encoding for ${blob.path}`);
      }

      const buffer = Buffer.from(
        result.content.replace(/\s/g, ""),
        "base64"
      );

      // Avoid uploading binary files.
      if (buffer.includes(0)) return null;

      return {
        path: blob.path,
        content: buffer.toString("utf8"),
        language: getLanguage(blob.path),
      };
    })
  ).filter(Boolean);

  return {
    repositoryId,
    commitSha,
    files,
  };
}
