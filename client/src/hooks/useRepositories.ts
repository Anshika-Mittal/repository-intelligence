import { useCallback, useEffect, useState } from "react";

import { repositoryService } from "../services/repositoryService";

import type { Repository } from "../types/repository.types";

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await repositoryService.getAll();

      setRepositories(data);
    } catch (err) {
      setError("Unable to load repositories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  return {
    repositories,
    loading,
    error,
    refresh: fetchRepositories,
  };
}