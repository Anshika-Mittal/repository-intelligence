
import "dotenv/config";
import {
  createInterface,
  type Interface,
} from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { createRepositoryAgent } from "./agent.js";
import type { RepositoryStorage } from "../tools/s3Repository.js";
import { ingestion } from "../ingestion/ingestRepository.js";
import { retrieveRepositoryContext } from "./retrieveRepositoryContext.js";

type RepositoryContext = {
  repositoryId: string;
  commitSha: string;
};

// Ask for a repository and ingest it.
async function getRepositoryUrl(
  rl: Interface
): Promise<{ repoUrl: string } & RepositoryContext> {
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

  return {
    repoUrl,
    repositoryId: result.repositoryId,
    commitSha: result.commitSha,
  };
}

// Retrieve relevant summaries and provide them to the agent.
async function askRepositoryQuestion(
  question: string,
  repoUrl: string,
  repository: RepositoryContext
) {
  const context = await retrieveRepositoryContext({
    query: question,
    repositoryId: repository.repositoryId,
    commitSha: repository.commitSha,
    numberOfResults: 1,
  });

  console.log("\nRetrieved repository context:");
  console.dir(context, { depth: null });

  const contextText =
    context.length > 0
      ? JSON.stringify(context, null, 2)
      : "No relevant repository context was retrieved.";

  const prompt = `
Repository URL: ${repoUrl}

User question:
${question}

Retrieved repository context:
${contextText}

Instructions:
- Answer using the retrieved repository context where relevant.
- Refer to source file paths when possible.
- If the context is insufficient, clearly state what is missing.
- Do not invent implementation details.
`;

  const result = await agent.invoke(prompt);

  console.log("\nRepository Intelligence Assistant:");
  console.dir(result.lastMessage, { depth: null });
}

async function main() {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    // Step 1: Ingest the repository or detect an existing version.
    const repository = await getRepositoryUrl(rl);

    // Step 2: Ask the initial question.
    await askRepositoryQuestion(
      "Explain the overall architecture of the given repository.",
      repository.repoUrl,
      repository
    );

    // Step 3: Continue the conversation.
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
        repository.repoUrl,
        repository
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
