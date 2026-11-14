import { useNavigate } from "react-router-dom";
import {
  Github,
  MessageSquare,
  GitBranch,
  Lightbulb,
  Code,
} from "lucide-react";

import type { Repository } from "../../types/repository.types";

interface Props {
  repository: Repository;
}

export default function RepositoryOverview({
  repository,
}: Props) {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Explain repository architecture",
      description: "Understand the overall structure.",
      icon: GitBranch,
      prompt:
        "Explain the overall architecture of this repository.",
    },
    {
      title: "Explore execution flow",
      description: "Understand how the code works.",
      icon: Code,
      prompt:
        "Explain the important execution flows in this repository.",
    },
    {
      title: "Discover project features",
      description: "Explore key features and functionality.",
      icon: Lightbulb,
      prompt:
        "Identify and explain the main features of this repository.",
    },
    {
      title: "Find contribution opportunities",
      description: "Discover areas where developers can contribute.",
      icon: Github,
      prompt:
        "Identify potential contribution opportunities in this repository.",
    },
  ];

  const startChat = (prompt?: string) => {
    const query = prompt
      ? `?prompt=${encodeURIComponent(prompt)}`
      : "";

    navigate(
      `/repositories/${repository.id}/chat${query}`
    );
  };

  return (
    <div className="workspace-overview">
      <div className="workspace-title">
        <div>
          <h1>{repository.name}</h1>
          <p>
            {repository.owner}/{repository.name}
          </p>
        </div>

        <a
          href={repository.githubUrl}
          target="_blank"
          rel="noreferrer"
        >
          <Github size={19} />
          View on GitHub
        </a>
      </div>

      <section className="overview-card">
        <h2>About this repository</h2>

        <p>
          {repository.description ||
            "Explore the structure and functionality of this codebase."}
        </p>

        <div className="repo-details">
          <div>
            <span>Language</span>
            <strong>{repository.language || "Unknown"}</strong>
          </div>

          <div>
            <span>Indexed commit</span>
            <strong>
              {repository.commitSha?.slice(0, 12) || "Unknown"}
            </strong>
          </div>
        </div>
      </section>

      <section>
        <h2>What would you like to explore?</h2>

        <div className="action-grid">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                className="explore-card"
                key={action.title}
                onClick={() => startChat(action.prompt)}
              >
                <Icon size={23} />
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <button
        className="primary-button"
        onClick={() => startChat()}
      >
        <MessageSquare size={18} />
        Chat with Repository AI
      </button>
    </div>
  );
}