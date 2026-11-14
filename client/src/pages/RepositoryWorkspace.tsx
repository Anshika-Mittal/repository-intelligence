import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";

import api from "../services/api";
import { repositoryService } from "../services/repositoryService";
import type { Repository } from "../types/repository.types";
import Loader from "../components/common/Loader";
import RepositoryOverview from
  "../components/repositories/RepositoryOverview";

interface ProcessingStatus {
  status: string;
  stage: string;
  progress: number;
  message: string;
}

const stages = [
  "validating",
  "cloning",
  "summarizing",
  "generating_summaries",
  "uploading",
  "syncing_knowledge_base",
  "completed",
];

const stageLabels = [
  "Validating repository",
  "Fetching repository",
  "Analyzing source files",
  "Generating AI summaries",
  "Storing repository knowledge",
  "Preparing AI knowledge base",
];

export default function RepositoryWorkspace() {
  const { id } = useParams<{ id: string }>();

  const [repository, setRepository] =
    useState<Repository | null>(null);

  const [status, setStatus] =
    useState<ProcessingStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;
    let timeout: ReturnType<typeof setTimeout>;

    const fetchData = async () => {
      try {
        const repo = await repositoryService.getById(id);

        if (!active) return;

        setRepository(repo);

        if (repo.status === "completed") {
          setStatus({
            status: "completed",
            stage: "completed",
            progress: 100,
            message: "Repository is ready!",
          });
          setLoading(false);
          return;
        }

        const response = await api.get(
          `/api/repositories/${id}/status`
        );

        if (!active) return;

        setStatus(response.data);

        if (
          response.data.status === "failed" ||
          response.data.status === "completed"
        ) {
          setLoading(false);
          return;
        }

        timeout = setTimeout(fetchData, 3000);
      } catch {
        if (active) {
          setError("Unable to retrieve repository status.");
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [id]);

  if (loading && !status) {
    return <Loader message="Loading repository..." />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!repository || !status) return null;

  if (status.status === "completed") {
    return <RepositoryOverview repository={repository} />;
    // return (
    //   <div className="workspace-overview">
    //     <h1>{repository.name}</h1>

    //     <p>
    //       Your repository has been successfully indexed.
    //     </p>

    //     <p>
    //       Commit: {repository.commitSha?.slice(0, 12) || "Not available"}
    //     </p>

    //     <button
    //       onClick={() =>
    //         window.location.assign(
    //           `/repositories/${repository.id}/chat`
    //         )
    //       }
    //       className="primary-button"
    //     >
    //       Start Exploring with AI
    //     </button>
    //   </div>
    // );
  }

  if (status.status === "failed") {
    return (
      <div className="processing-container">
        <XCircle size={42} />
        <h2>Repository processing failed</h2>
        <p>{status.message}</p>
      </div>
    );
  }

  const currentStage = stages.indexOf(status.stage);

  return (
    <div className="processing-container">
      <LoaderCircle size={42} className="spin" />

      <h1>Analyzing your repository</h1>

      <p>{status.message}</p>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, Math.max(0, status.progress))}%`,
          }}
        />
      </div>

      <p>{status.progress}% completed</p>

      <div className="processing-stages">
        {stageLabels.map((label, index) => (
          <div className="processing-stage" key={label}>
            {index < currentStage ? (
              <CheckCircle2 color="green" />
            ) : index === currentStage ? (
              <LoaderCircle className="spin" />
            ) : (
              <div className="stage-circle" />
            )}

            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}