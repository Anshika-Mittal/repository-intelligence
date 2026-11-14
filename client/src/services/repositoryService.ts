
import { apiRequest } from "./api";

import type {
  Repository,
  RepositoryStats,
} from "../types/repository.types";

export const repositoryService = {
  async getAll(): Promise<Repository[]> {
    const response = await apiRequest<{
      repositories: Repository[];
    }>("/api/repositories");

    return response.repositories;
  },

  async getById(id: string): Promise<Repository> {
    const response = await apiRequest<{
      repository: Repository;
    }>(`/api/repositories/${id}`);

    return response.repository;
  },

  async add(url: string) {
    return apiRequest("/api/repositories", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  async getStatus(id: string) {
    return apiRequest(`/api/repositories/${id}/status`);
  },

  async reindex(id: string) {
    return apiRequest(`/api/repositories/${id}/reindex`, {
      method: "POST",
    });
  },

  async getStats(): Promise<RepositoryStats> {
    const repositories = await this.getAll();

    return {
      total: repositories.length,
      completed: repositories.filter(
        (r) => r.status === "completed"
      ).length,
      processing: repositories.filter(
        (r) =>
          r.status === "processing" ||
          r.status === "queued"
      ).length,
      failed: repositories.filter(
        (r) => r.status === "failed"
      ).length,
    };
  },
};
