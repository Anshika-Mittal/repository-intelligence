
import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

type UploadDocumentsOptions = {
  owner: string;
  repo: string;
  repositoryId: string;
  commitSha: string;
  documents: Array<{
    file_path: string;
    [key: string]: unknown;
  }>;
};

export async function uploadDocuments({
  owner,
  repo,
  repositoryId,
  commitSha,
  documents,
}: UploadDocumentsOptions) {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured.");
  }

  if (!repositoryId.trim() || !commitSha.trim()) {
    throw new Error("Repository ID and commit SHA are required.");
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error("No documents provided for upload.");
  }

  const prefix =
    `repositories/${owner}/${repo}/${commitSha}/summaries`;

  const uploadedKeys: string[] = [];

  for (const document of documents) {
    if (
      typeof document.file_path !== "string" ||
      !document.file_path.trim()
    ) {
      throw new Error("A summary is missing file_path.");
    }

    const encodedPath = document.file_path
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    const key = `${prefix}/${encodedPath}.json`;

    // 1. Upload the summary document.
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(document),
        ContentType: "application/json",
      })
    );

    // 2. Upload its Bedrock metadata sidecar.
    const metadata = {
      metadataAttributes: {
        repository_id: repositoryId,
        commit_sha: commitSha,
      },
    };

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${key}.metadata.json`,
        Body: JSON.stringify(metadata),
        ContentType: "application/json",
      })
    );

    uploadedKeys.push(key);
    uploadedKeys.push(`${key}.metadata.json`);

    console.log(`Uploaded summary: ${key}`);
    console.log(`Uploaded metadata: ${key}.metadata.json`);
  }

  return {
    bucket: BUCKET_NAME,
    prefix,
    uploadedCount: documents.length,
    uploadedKeys,
  };
}
