import { useNavigate } from "react-router-dom";

import { Github, ArrowLeft } from "lucide-react";

import AddRepositoryForm from "../components/repositories/AddRepositoryForm";

export default function AddRepository() {
  const navigate = useNavigate();

  return (
    <div className="add-repository-page">
      <button
        className="back-button"
        onClick={() => navigate("/repositories")}
      >
        <ArrowLeft size={18} />
        Back to repositories
      </button>

      <div className="add-repository-container">
        <div className="add-repo-icon">
          <Github size={35} />
        </div>

        <h1>Add a GitHub Repository</h1>

        <p>
          Connect your repository to Repository Intelligence.
          Our AI will analyze the codebase and prepare it
          for intelligent conversations.
        </p>

        <AddRepositoryForm
          onSuccess={(id) =>
            navigate(`/repositories/${id}?processing=true`)
          }
        />
      </div>
    </div>
  );
}