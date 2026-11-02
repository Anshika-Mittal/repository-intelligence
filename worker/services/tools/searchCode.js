
import fs from "fs";
import path from "path";

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
]);

// const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const MAX_RESULTS = 500;

/**
 * Recursively collect files from a repository.
 */
function collectFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isSymbolicLink()) continue;

    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Search code in a local repository.
 *
 * @param {Object} params
 * @param {string} params.repoPath - Local repository path
 * @param {string} params.query - Search keyword
 * @param {string} [params.fileExtension] - Optional extension, e.g. ".js"
 * @param {number} [params.limit=20] - Maximum matching lines
 */
export async function searchCode({
  repoPath,
  query,
  fileExtension,
  limit = 20,
}) {
  if (typeof repoPath !== "string" || !repoPath.trim()) {
    throw new Error("Repository path is required.");
  }

  if (typeof query !== "string" || !query.trim()) {
    throw new Error("Search query is required.");
  }

  if (
    fileExtension !== undefined &&
    (typeof fileExtension !== "string" ||
      !/^\.[a-zA-Z0-9]+$/.test(fileExtension))
  ) {
    throw new Error(
      'Invalid extension. Example: ".js"'
    );
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_RESULTS
  ) {
    throw new Error(
      `Limit must be between 1 and ${MAX_RESULTS}.`
    );
  }

  const root = path.resolve(repoPath);

  if (
    !fs.existsSync(root) ||
    !fs.statSync(root).isDirectory()
  ) {
    throw new Error("Repository directory does not exist.");
  }

  const normalizedQuery = query.trim().toLowerCase();
  const files = collectFiles(root);
  const results = [];

  for (const file of files) {
    if (results.length >= limit) break;

    if (
      fileExtension &&
      path.extname(file).toLowerCase() !==
        fileExtension.toLowerCase()
    ) {
      continue;
    }

    const stat = fs.statSync(file);

    if (stat.size > MAX_FILE_SIZE) continue;

    let content;

    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    // Skip files containing null bytes (likely binary).
    if (content.includes("\0")) continue;

    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].toLowerCase().includes(normalizedQuery)
      ) {
        results.push({
          file: path.relative(root, file),
          line: i + 1,
          code: lines[i].trim().slice(0, 500),
        });

        if (results.length >= limit) break;
      }
    }
  }

  return {
    query: query.trim(),
    totalMatchesReturned: results.length,
    results,
  };
}

