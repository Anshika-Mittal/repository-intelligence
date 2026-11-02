
import { useEffect, useState } from "react";
import { getRepositories } from "../services/repositoryService";

export default function Repositories() {
  const [repositories, setRepositories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRepositories() {
      try {
        const data = await getRepositories();
        setRepositories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRepositories();
  }, []);

  if (loading) return <p>Loading repositories...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Your Repositories</h1>

      {repositories.map((repo) => (
        <div key={repo.id}>
          {repo.github_owner}/{repo.github_repo}
        </div>
      ))}
    </div>
  );
}
