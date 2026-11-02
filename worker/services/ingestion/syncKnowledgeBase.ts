
import "dotenv/config";

import {
  BedrockAgentClient,
  StartIngestionJobCommand,
  GetIngestionJobCommand,
  type IngestionJob,
} from "@aws-sdk/client-bedrock-agent";

const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;
const dataSourceId = process.env.BEDROCK_DATA_SOURCE_ID;
const region = process.env.AWS_REGION;

if (!knowledgeBaseId || !dataSourceId || !region) {
  throw new Error(
    "Missing AWS_REGION, BEDROCK_KNOWLEDGE_BASE_ID, or BEDROCK_DATA_SOURCE_ID."
  );
}

const client = new BedrockAgentClient({ region });

type SyncOptions = {
  waitForCompletion?: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

export async function syncKnowledgeBase({
  waitForCompletion = true,
  pollIntervalMs = 5000,
  timeoutMs = 10 * 60 * 1000,
}: SyncOptions = {}): Promise<IngestionJob> {
  // Start the data source ingestion job.
  const startResponse = await client.send(
    new StartIngestionJobCommand({
      knowledgeBaseId,
      dataSourceId,
      description: "Sync repository summaries from S3",
    })
  );

  const job = startResponse.ingestionJob;

  if (!job?.ingestionJobId) {
    throw new Error("Bedrock did not return an ingestion job ID.");
  }

  const ingestionJobId = job.ingestionJobId;

  console.log(`Knowledge Base ingestion started: ${ingestionJobId}`);
  console.log(`Initial status: ${job.status}`);

  // Return immediately if the caller only needs the job ID and status.
  if (!waitForCompletion) {
    return job;
  }

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, pollIntervalMs);
    });

    const statusResponse = await client.send(
      new GetIngestionJobCommand({
        knowledgeBaseId,
        dataSourceId,
        ingestionJobId,
      })
    );

    const currentJob = statusResponse.ingestionJob;

    if (!currentJob) {
      throw new Error(
        `Could not retrieve ingestion job ${ingestionJobId}.`
      );
    }

    console.log(`Knowledge Base status: ${currentJob.status}`);

    if (currentJob.status === "COMPLETE") {
      if ((currentJob.statistics?.numberOfDocumentsFailed ?? 0) > 0) {
        throw new Error(
          `Knowledge Base ingestion completed with failed documents: ${
            currentJob.statistics?.numberOfDocumentsFailed
          }`
        );
      }

      console.log("Knowledge Base sync completed successfully.");
      return currentJob;
    }

    if (
      currentJob.status === "FAILED" ||
      currentJob.status === "STOPPED"
    ) {
      throw new Error(
        `Knowledge Base ingestion ${currentJob.status}: ${
          currentJob.failureReasons?.join("; ") ||
          "No failure reason was provided."
        }`
      );
    }
  }

  throw new Error(
    `Timed out waiting for Knowledge Base ingestion job ${ingestionJobId}.`
  );
}
