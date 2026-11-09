
import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { retrieveRepositoryContext } from "./retrieveRepositoryContext.js";

import {
  getRepositoryStructure,
  getS3FileContent,
  searchS3Repository,
  type RepositoryStorage,
} from "../tools/s3Repository.js";

export function createRepositoryTools(repository: RepositoryStorage) {
  const prefix = repository.s3Prefix;

  return [
    tool({
      name: "get_repo_structure",
      description:
        "Get the directory and file structure of the current repository.",
      inputSchema: z.object({}),
      callback: async () => {
        return await getRepositoryStructure.callback({ repoUrl: prefix });
      },
    }),

    tool({
      name: "search_code",
      description:
        "Search for exact text or code within the current repository.",
      inputSchema: z.object({
        query: z.string().min(1),
        fileExtension: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
      callback: async ({ query, fileExtension, limit }) => {
        return await searchS3Repository({
          s3Prefix: prefix,
          query,
          fileExtension,
          limit,
        });
      },
    }),

    tool({
      name: "get_file_content",
      description:
        "Read a specific source file from the current repository.",
      inputSchema: z.object({
        filePath: z.string().min(1),
        startLine: z.number().int().min(1).default(1),
        endLine: z.number().int().min(1).optional(),
      }),
      callback: async ({ filePath, startLine, endLine }) => {
        return await getS3FileContent({
          s3Prefix: prefix,
          filePath,
          startLine,
          endLine,
        });
      },
    }),

    tool({
      name: "search_repository_knowledge_base",
      description:
        "Semantically search the current repository's indexed knowledge base. Use this to retrieve relevant context before answering repository questions.",
      inputSchema: z.object({
        query: z.string().min(1),
      }),
      callback: async ({ query }) => {
        const results = await retrieveRepositoryContext({
          query,
          repositoryId: repository.repositoryId,
          commitSha: repository.commitSha,
          numberOfResults: 5,
        });

        if (!results.length) {
          return "No relevant repository passages were found.";
        }

        return JSON.stringify(results);
      },
    }),
  ];
}
