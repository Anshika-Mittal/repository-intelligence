
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import { getRepositoryStructure as fetchRepositoryStructure } from "../tools/getRepoStructure.js";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const bucket = requiredEnv("S3_BUCKET_NAME");

const s3 = new S3Client({
  region: requiredEnv("AWS_REGION"),
});

export type RepositoryStorage = {
  repositoryId: string;
  commitSha: string;
  s3Prefix: string;
};

function normalizePrefix(prefix: string): string {
  const value = prefix.trim().replace(/^\/+|\/+$/g, "");

  if (!value || value.split("/").some(part => part === "." || part === "..")) {
    throw new Error("Invalid S3 repository prefix.");
  }

  return `${value}/`;
}

function normalizeFilePath(filePath: string): string {
  const value = filePath.trim().replace(/\\/g, "/");

  if (
    !value ||
    value.startsWith("/") ||
    value.split("/").some(part => !part || part === "." || part === "..")
  ) {
    throw new Error("Invalid repository file path.");
  }

  return value;
}

async function listObjects(
  prefix: string,
  maxObjects = 5000
) {
  const objects: { key: string; size: number }[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: Math.min(1000, maxObjects - objects.length),
      })
    );

    for (const item of response.Contents ?? []) {
      if (item.Key && item.Size !== undefined) {
        objects.push({
          key: item.Key,
          size: item.Size,
        });
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken && objects.length < maxObjects);

  return {
    objects,
    truncated: Boolean(continuationToken),
  };
}

export async function getS3FileContent({
  s3Prefix,
  filePath,
  startLine = 1,
  endLine,
}: {
  s3Prefix: string;
  filePath: string;
  startLine?: number;
  endLine?: number;
}) {
  const prefix = normalizePrefix(s3Prefix);
  const safePath = normalizeFilePath(filePath);

  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: `${prefix}${safePath}`,
    })
  );

  if ((response.ContentLength ?? 0) > 1_000_000) {
    throw new Error("File exceeds the 1 MB reading limit.");
  }

  const content = await response.Body?.transformToString("utf-8");

  if (content === undefined) {
    throw new Error("Could not read file from S3.");
  }

  if (content.includes("\0")) {
    throw new Error("Binary files cannot be displayed as text.");
  }

  const lines = content.split(/\r?\n/);

  if (
    !Number.isInteger(startLine) ||
    startLine < 1 ||
    (endLine !== undefined &&
      (!Number.isInteger(endLine) || endLine < startLine))
  ) {
    throw new Error("Invalid line range.");
  }

  const selectedLines = lines.slice(
    startLine - 1,
    endLine ?? lines.length
  );

  const fullContent = selectedLines.join("\n");
  const truncated = fullContent.length > 20_000;

  return {
    filePath: safePath,
    startLine,
    endLine: Math.min(endLine ?? lines.length, lines.length),
    totalLines: lines.length,
    truncated,
    content: truncated
      ? fullContent.slice(0, 20_000)
      : fullContent,
  };
}

export const getRepositoryStructure = {
  name: "getRepositoryStructure",

  description:
    "Fetches the complete file and directory structure of the currently selected public GitHub repository. Use this tool when the user asks about repository structure, files, folders, or project organization.",

  inputSchema: {
    json: {
      type: "object",
      properties: {
        repoUrl: {
          type: "string",
          description: "The GitHub repository URL.",
        },
      },
      required: ["repoUrl"],
    },
  },

  callback: async ({ repoUrl }: { repoUrl: string }) => {
    try {
      return await fetchRepositoryStructure(repoUrl);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export async function searchS3Repository({
  s3Prefix,
  query,
  fileExtension,
  limit = 20,
}: {
  s3Prefix: string;
  query: string;
  fileExtension?: string;
  limit?: number;
}) {
  const prefix = normalizePrefix(s3Prefix);
  const { objects, truncated: listingTruncated } =
    await listObjects(prefix, 300);

  const matches: { filePath: string; lineNumber: number; snippet: string }[] = [];
  let filesScanned = 0;

  for (const object of objects) {
    if (matches.length >= limit) break;

    const filePath = object.key.slice(prefix.length);

    if (
      fileExtension &&
      !filePath.toLowerCase().endsWith(`.${fileExtension.toLowerCase().replace(/^\./, "")}`)
    ) {
      continue;
    }

    if (object.size > 1_000_000) continue;

    try {
      const result = await getS3FileContent({
        s3Prefix: prefix,
        filePath,
      });

      filesScanned++;

      const lines = result.content.split(/\r?\n/);

      lines.forEach((line, index) => {
        if (
          matches.length < limit &&
          line.toLowerCase().includes(query.toLowerCase())
        ) {
          matches.push({
            filePath,
            lineNumber: index + 1,
            snippet: line.trim().slice(0, 300),
          });
        }
      });
    } catch {
      // Skip files that cannot be read as text.
    }
  }

  return {
    query,
    matches,
    filesScanned,
    listingTruncated,
  };
}
