import {
    BrainCircuit,
    Network,
    GitBranch,
    Lightbulb,
    Bug
} from "lucide-react";

interface ChatWelcomeProps {
    repositoryName?: string;
    onPromptClick: (prompt: string) => void;
}

const suggestions = [
    {
        icon: Network,
        title: "Understand architecture",
        description: "Explain how my project is structured.",
        prompt: "Explain the overall architecture of this repository."
    },
    {
        icon: GitBranch,
        title: "Explore code flow",
        description: "Understand how different modules interact.",
        prompt: "Explain the main execution flow of this repository."
    },
    {
        icon: Lightbulb,
        title: "Discover features",
        description: "Find important features and functionalities.",
        prompt: "What are the main features of this repository?"
    },
    {
        icon: Bug,
        title: "Find improvements",
        description: "Discover areas that could be improved.",
        prompt: "Identify potential improvements in this codebase."
    }
];

export default function ChatWelcome({
    repositoryName,
    onPromptClick
}: ChatWelcomeProps) {

    return (
        <div className="chat-welcome">

            <div className="welcome-icon">
                <BrainCircuit size={34} />
            </div>

            <h1>
                Understand your codebase.
            </h1>

            <h2>
                Build with intelligence.
            </h2>

            <p className="welcome-description">
                Ask questions, explore architecture, understand
                code flows, and discover new possibilities
                in your repository.
            </p>

            {repositoryName && (
                <div className="active-repository">
                    <span>Currently exploring</span>
                    <strong>{repositoryName}</strong>
                </div>
            )}

            <div className="suggestion-grid">

                {suggestions.map(item => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.title}
                            className="suggestion-card"
                            onClick={() => onPromptClick(item.prompt)}
                        >
                            <Icon size={22} />

                            <strong>{item.title}</strong>

                            <span>{item.description}</span>
                        </button>
                    );
                })}

            </div>

        </div>
    );
}