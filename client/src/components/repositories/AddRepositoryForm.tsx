import { useState } from "react";
import { Github, Plus, LoaderCircle } from "lucide-react";

import { repositoryService } from "../../services/repositoryService";

interface Props {
  onSuccess: (repositoryId: string) => void;
}

export default function AddRepositoryForm({
  onSuccess,
}: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateGitHubUrl = (value: string) => {
    try {
      const parsed = new URL(value.trim());

      if (
        parsed.hostname !== "github.com" &&
        parsed.hostname !== "www.github.com"
      ) {
        return false;
      }

      const segments = parsed.pathname
        .split("/")
        .filter(Boolean);

      return (
        segments.length === 2 &&
        segments.every((part) =>
          /^[a-zA-Z0-9_.-]+$/.test(part)
        )
      );
    } catch {
      return false;
    }
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (!validateGitHubUrl(url)) {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }

    try {
      setLoading(true);

      const result = await repositoryService.add(url.trim());

      onSuccess(result.repository.id);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Unable to add repository."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-repo-form">
      <div className="repo-input-label">
        <Github size={20} />
        <label htmlFor="github-url">
          GitHub Repository URL
        </label>
      </div>

      <input
        id="github-url"
        type="url"
        placeholder="https://github.com/owner/repository"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        disabled={loading}
      />

      {error && <p className="error-message">{error}</p>}

      <p className="input-help">
        Currently, public GitHub repositories are supported.
      </p>

      <button
        type="submit"
        className="primary-button"
        disabled={loading}
      >
        {loading ? (
          <>
            <LoaderCircle className="spin" size={18} />
            Adding Repository...
          </>
        ) : (
          <>
            <Plus size={18} />
            Analyze Repository
          </>
        )}
      </button>
    </form>
  );
}