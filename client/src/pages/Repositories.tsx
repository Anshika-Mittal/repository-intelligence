import { useNavigate } from "react-router-dom";
import { Plus, Github } from "lucide-react";

import { useRepositories } from "../hooks/useRepositories";
import RepositoryCard from "../components/repositories/RepositoryCard";
import Loader from "../components/common/Loader";

export default function Repositories() {
  const navigate = useNavigate();

  const {
    repositories,
    loading,
    error,
  } = useRepositories();

  return (
    <div className="repositories-page">
      <div className="section-heading">
        <div>
          <h1>My Repositories</h1>
          <p>Manage your connected codebases.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/repositories/add")}
        >
          <Plus size={18} />
          Add Repository
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : repositories.length === 0 ? (
        <div className="empty-state">
          <Github size={40} />
          <h2>No repositories found</h2>
          <p>Add a GitHub repository to get started.</p>
        </div>
      ) : (
        <div className="repository-grid">
          {repositories.map((repository) => (
            <RepositoryCard
              key={repository.id}
              repository={repository}
            />
          ))}
        </div>
      )}
    </div>
  );
}