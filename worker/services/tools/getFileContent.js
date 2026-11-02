
import fs from "fs";
import path from "path";

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const MAX_OUTPUT_CHARS = 20000;

/**
 * Retrieve the content of a repository file.
 *
 * @param {Object} params
 * @param {string} params.repoPath - Local repository directory
 * @param {string} params.filePath - Relative file path
 * @param {number} [params.startLine=1] - First line to return
 * @param {number} [params.endLine] - Last line to return
 */
export async function getFileContent({
  repoPath,
  filePath,
  startLine = 1,
  endLine,
}) {
  // 1. Validate required inputs.
  if (
    typeof repoPath !== "string" ||
    !repoPath.trim()
  ) {
    throw new Error("Repository path is required.");
  }

  if (
    typeof filePath !== "string" ||
    !filePath.trim()
  ) {
    throw new Error("File path is required.");
  }

  // 2. Validate line numbers.
  if (!Number.isInteger(startLine) || startLine < 1) {
    throw new Error(
      "startLine must be a positive integer."
    );
  }

  if (
    endLine !== undefined &&
    (!Number.isInteger(endLine) ||
      endLine < startLine)
  ) {
    throw new Error(
      "endLine must be an integer greater than or equal to startLine."
    );
  }

  // 3. Resolve the repository root.
  const root = path.resolve(repoPath);

  if (
    !fs.existsSync(root) ||
    !fs.statSync(root).isDirectory()
  ) {
    throw new Error(
      "Repository directory does not exist."
    );
  }

  const realRoot = await fs.promises.realpath(root);

  // 4. Reject absolute paths and path traversal.
  if (path.isAbsolute(filePath)) {
    throw new Error(
      "Absolute file paths are not allowed."
    );
  }

  const target = path.resolve(root, filePath);
  const relativePath = path.relative(root, target);

  if (
    !relativePath ||
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(
      "File path must point inside the repository."
    );
  }

  // 5. Resolve symlinks and verify the final location.
  let realTarget;

  try {
    realTarget = await fs.promises.realpath(target);
  } catch {
    throw new Error(
      "File not found in the repository."
    );
  }

  const realRelative = path.relative(
    realRoot,
    realTarget
  );

  if (
    !realRelative ||
    realRelative === ".." ||
    realRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(realRelative)
  ) {
    throw new Error(
      "Access outside the repository is not allowed."
    );
  }

  // 6. Check that the target is a regular file.
  const stat = await fs.promises.stat(realTarget);

  if (!stat.isFile()) {
    throw new Error(
      "The requested path is not a file."
    );
  }

  if (stat.size > MAX_FILE_SIZE) {
    throw new Error(
      "File exceeds the 1 MB size limit."
    );
  }

  // 7. Read the file as UTF-8 text.
  const content = await fs.promises.readFile(
    realTarget,
    "utf8"
  );

  if (content.includes("\0")) {
    throw new Error(
      "Binary files are not supported."
    );
  }

  // 8. Split the content into lines.
  const lines = content.split(/\r?\n/);

  if (startLine > lines.length) {
    throw new Error(
      `startLine exceeds the file length (${lines.length} lines).`
    );
  }

  const actualEndLine = Math.min(
    endLine ?? lines.length,
    lines.length
  );

  // 9. Extract the requested line range.
  const selectedLines = lines.slice(
    startLine - 1,
    actualEndLine
  );

  let output = "";
  let returnedEndLine = startLine - 1;
  let truncated = false;

  // 10. Limit the response size.
  for (const line of selectedLines) {
    const nextLine = `${line}\n`;

    if (
      output.length + nextLine.length >
      MAX_OUTPUT_CHARS
    ) {
      truncated = true;
      break;
    }

    output += nextLine;
    returnedEndLine++;
  }

  return {
    filePath: relativePath.split(path.sep).join("/"),
    startLine,
    endLine: returnedEndLine,
    totalLines: lines.length,
    truncated,
    content: output,
  };
}

