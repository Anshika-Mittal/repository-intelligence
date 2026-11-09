
import "dotenv/config";
import {
  createInterface,
  type Interface,
} from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { createRepositoryAgent } from "./agent.js";
import { getRepositoryStructure, type RepositoryStorage } from "../tools/s3Repository.js";
import { ingestion } from "../ingestion/ingestRepository.js";
import { retrieveRepositoryContext } from "./retrieveRepositoryContext.js";

type RepositoryContext = RepositoryStorage & {
  repoUrl: string;
};

import pool from "../config/db.js";

async function getRepositoryS3Prefix(
  repositoryId: string,
  commitSha: string
): Promise<string> {
  const result = await pool.query(
    `
      SELECT s3_prefix
      FROM repository_versions
      WHERE repository_id = $1
        AND commit_sha = $2
      LIMIT 1
    `,
    [repositoryId, commitSha]
  );

  const s3Prefix = result.rows[0]?.s3_prefix;

  if (!s3Prefix) {
    throw new Error("S3 prefix not found for this repository version.");
  }

  return s3Prefix;
}

// Ask for a repository and ingest it.
async function getRepositoryUrl(
  rl: Interface
): Promise<RepositoryContext> {
  const repoUrl = (
    await rl.question("Enter GitHub repository URL: ")
  ).trim();

  if (!repoUrl) {
    throw new Error("GitHub repository URL is required.");
  }

  const result = await ingestion(repoUrl);

  console.log("\nRepository ingestion result:");
  console.dir(result, { depth: null });

  if (!result.repositoryId || !result.commitSha) {
    throw new Error(
      "Ingestion did not return repositoryId and commitSha."
    );
  }

  const s3Prefix = await getRepositoryS3Prefix(
    result.repositoryId,
    result.commitSha
  );

  return {
    repoUrl,
    repositoryId: result.repositoryId,
    commitSha: result.commitSha,
    s3Prefix,
  };
}
// Retrieve relevant summaries and provide them to the agent.
async function askRepositoryQuestion(
  question: string,
  repository: RepositoryContext,
  repositoryAgent: ReturnType<typeof createRepositoryAgent>
) {
  const context = await retrieveRepositoryContext({
    query: question,
    repositoryId: repository.repositoryId,
    commitSha: repository.commitSha,
    numberOfResults: 5,
  });

  console.log("\nRetrieved repository context:");
  console.dir(context, { depth: null });

  const contextText =
    context.length > 0
      ? JSON.stringify(context, null, 2)
      : "No relevant repository context was retrieved.";

  const prompt = `
Repository URL: ${repository.repoUrl}

User question:
${question}

Retrieved repository context:
${contextText}

Instructions:
- Answer using the retrieved repository context where relevant.
- Use tools to inspect source files when necessary.
- Refer to source file paths when possible.
- If the context is insufficient, clearly state what is missing.
- Do not invent implementation details.
`;

  try {

    const result = await getRepositoryStructure.callback({
      repoUrl: "https://github.com/Anshika-Mittal/DentyTech",
    });

  // const result = await repositoryAgent.invoke(prompt);
  // console.log("STOP REASON:", result.stopReason);
  console.log("RESPONSE:", JSON.stringify(result, null, 2));

  console.log("\nComplete agent result:");
  console.dir(result, { depth: null });

  console.log("\nLast message:");
  // console.dir(result.lastMessage, { depth: null });
} catch (error) {
  console.error("\nAGENT INVOCATION ERROR:");

  if (error instanceof Error) {
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  } else {
    console.dir(error, { depth: null });
  }
}
}

async function main() {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    // Step 1: Ingest repository and retrieve its S3 prefix.
    const repository = await getRepositoryUrl(rl);

    // Step 2: Create an agent specifically for this repository.
    const repositoryAgent = createRepositoryAgent({
      repositoryId: repository.repositoryId,
      commitSha: repository.commitSha,
      s3Prefix: repository.s3Prefix,
    });

    // Step 3: Ask the initial question.
    await askRepositoryQuestion(
      "Explain the overall architecture of the given repository.",
      repository,
      repositoryAgent
    );

    // Step 4: Continue the conversation.
    while (true) {
      const userMessage = (
        await rl.question("\nUser (type 'exit' to quit): ")
      ).trim();

      if (userMessage.toLowerCase() === "exit") {
        break;
      }

      if (!userMessage) {
        continue;
      }

      await askRepositoryQuestion(
        userMessage,
        repository,
        repositoryAgent
      );
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("Agent failed:", error);
  process.exitCode = 1;
});
