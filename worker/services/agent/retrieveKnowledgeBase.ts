import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION,
});

export async function retrieveKnowledgeBase(
  query: string,
  repository?: string,
) {
  const response = await client.send(
    new RetrieveCommand({
      knowledgeBaseId: process.env.BEDROCK_KNOWLEDGE_BASE_ID!,

      retrievalQuery: {
        text: repository
          ? `Repository: ${repository}\nQuestion: ${query}`
          : query,
      },

      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: 5,
        },
      },
    }),
  );

  return (response.retrievalResults ?? []).map((item) => ({
    content: item.content?.text ?? "",
    score: item.score,
    location: item.location,
    metadata: item.metadata,
  }));
}
