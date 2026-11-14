import { GitBranch, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Repository } from "../../types/repository.types";

import RepositoryStatus from "./RepositoryStatus";

interface Props {
  repository: Repository;
}

export default function RepositoryCard({ repository }: Props) {
  const navigate = useNavigate();

  return (
    <div className="repository-card">
      <div className="repo-card-top">
        <div className="repo-icon">
          <GitBranch size={23} />
        </div>

        <RepositoryStatus status={repository.status} />
      </div>

      <h3>{repository.name}</h3>

      <p className="repo-owner">
        {repository.owner}/{repository.name}
      </p>

      <p className="repo-description">
        {repository.description || "No description available."}
      </p>

      <div className="repo-meta">
        <span>{repository.language || "Unknown language"}</span>

        <span>{new Date(repository.createdAt).toLocaleDateString()}</span>
      </div>

      <button
        className="repo-open-button"
        disabled={repository.status !== "completed"}
        onClick={() => navigate(`/repositories/${repository.id}`)}
      >
        Open Workspace
        <ArrowUpRight size={16} />
      </button>
    </div>
  );
}
