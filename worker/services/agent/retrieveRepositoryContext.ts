
import "dotenv/config";

import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

const region = process.env.AWS_REGION;
const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;

if (!region || !knowledgeBaseId) {
  throw new Error(
    "AWS_REGION and BEDROCK_KNOWLEDGE_BASE_ID are required."
  );
}

const client = new BedrockAgentRuntimeClient({ region });

type RetrieveContextOptions = {
  query: string;
  repositoryId: string;
  commitSha: string;
  numberOfResults?: number;
};

export async function retrieveRepositoryContext({
  query,
  repositoryId,
  commitSha,
  numberOfResults = 1,
}: RetrieveContextOptions) {
  if (!query.trim()) {
    throw new Error("A search query is required.");
  }

  if (!repositoryId.trim() || !commitSha.trim()) {
    throw new Error("Repository ID and commit SHA are required.");
  }

  const response = await client.send(
    new RetrieveCommand({
      knowledgeBaseId,
      retrievalQuery: {
        text: query,
      },
      retrievalConfiguration: {
      managedSearchConfiguration: {
        numberOfResults,
        filter: {
      andAll: [
        {
          equals: {
            key: "repository_id",
            value: repositoryId,
          },
        },
        {
          equals: {
            key: "commit_sha",
            value: commitSha,
          },
        },
      ],
    },
      },
    },
    })
  );

  const results = response.retrievalResults ?? [];

  console.dir(
  results.map((item) => ({
    content: item.content,
    score: item.score,
    metadata: item.metadata,
    location: item.location,
  })),
  { depth: null }
);
  return results.map((result) => ({
    content: result.content?.text ?? "",
    score: result.score ?? 0,
    location: result.location,
    metadata: result.metadata ?? {},
  }));
}
