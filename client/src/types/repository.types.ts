export type RepositoryStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export interface Repository {
  id: string;
  name: string;
  owner: string;
  githubUrl: string;
  description?: string;
  language?: string;
  status: RepositoryStatus;
  commitSha?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RepositoryStats {
  total: number;
  completed: number;
  processing: number;
  failed: number;
}