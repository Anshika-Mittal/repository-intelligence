import { useMemo, useState } from "react";

import {
    ChevronDown,
    PanelTop
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useRepositories } from "../hooks/useRepositories";
import { useChats } from "../hooks/useChats";

import Sidebar from "../components/layout/Sidebar";

import ChatWelcome from "../components/chat/ChatWelcome";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";

import Loader from "../components/common/Loader";

import "../styles/chat.css";

export default function Dashboard() {

    const { user } = useAuth();

    const {
        repositories,
        loading: repositoriesLoading,
        error: repositoriesError
    } = useRepositories();

    const {
        chats,
        activeChat,
        loading: chatsLoading,
        sending,
        error: chatError,
        startNewChat,
        openChat,
        sendMessage,
        deleteChat
    } = useChats();

    console.log("Repositories:", repositories);
console.log("First repository:", repositories[0]);

    const [selectedRepositoryId, setSelectedRepositoryId] =
        useState("");

    // Default to the first available repository.
    const repositoryId =
        activeChat?.repository_id ||
        selectedRepositoryId ||
        repositories[0]?.id ||
        "";

    const selectedRepository = useMemo(
        () => repositories.find(
            repository => repository.id === repositoryId
        ),
        [repositories, repositoryId]
    );

    const repositoryName = selectedRepository
        ? (
            // selectedRepository.full_name ||
            selectedRepository.name ||
            // selectedRepository.repo_name ||
            "Selected Repository"
        )
        : "";

    const handleNewChat = () => {
        startNewChat();
    };

    const handleSendMessage = async (message: string) => {
        if (!repositoryId) return;

        await sendMessage(message, repositoryId);
    };

    if (repositoriesLoading) {
        return <Loader message="Loading your workspace..." />;
    }

    return (
        <div className="dashboard-layout">

            {/* LEFT SIDEBAR */}

            <Sidebar
                chats={chats}
                activeChatId={activeChat?.id || null}
                onNewChat={handleNewChat}
                onOpenChat={openChat}
                onDeleteChat={deleteChat}
            />

            {/* MAIN CONTENT */}

            <main className="dashboard-main">

                {/* TOP HEADER */}

                <header className="dashboard-header">

                    <div className="header-left">
                        <PanelTop size={19} />

                        <span>
                            {activeChat?.title || "Workspace"}
                        </span>
                    </div>

                    <div className="repository-selector">

                        <span>Repository</span>

                        <div className="repository-select-wrapper">

                            <select
                                value={repositoryId}
                                onChange={e =>
                                    setSelectedRepositoryId(e.target.value)
                                }
                                disabled={!!activeChat}
                            >
                                {repositories.length === 0 ? (
                                    <option value="">
                                        No repositories available
                                    </option>
                                ) : (
                                    repositories.map(repository => (
                                        <option
                                            key={repository.id}
                                            value={repository.id}
                                        >
                                            {
                                            // repository.full_name ||
                                                repository.name || "Repository"
                                                // repository.repo_name
                                                }
                                        </option>
                                    ))
                                )}
                            </select>

                            <ChevronDown size={15} />

                        </div>

                    </div>

                </header>

                {/* CHAT CONTENT */}

                <div className="dashboard-content">

                    {repositoriesError ? (
                        <div className="empty-state">
                            <p className="error-message">
                                {repositoriesError}
                            </p>
                        </div>
                    ) : repositories.length === 0 ? (

                        <div className="empty-state">
                            <h2>No repositories connected</h2>

                            <p>
                                Add a GitHub repository before
                                starting a conversation.
                            </p>
                        </div>

                    ) : chatsLoading ? (

                        <Loader message="Loading conversations..." />

                    ) : activeChat ? (

                        <ChatWindow
                            messages={activeChat.messages}
                            sending={sending}
                        />

                    ) : (

                        <ChatWelcome
                            repositoryName={repositoryName}
                            onPromptClick={handleSendMessage}
                        />

                    )}

                    {/* ERROR MESSAGE */}

                    {chatError && (
                        <p className="error-message chat-error">
                            {chatError}
                        </p>
                    )}

                    {/* CHAT INPUT */}

                    {repositories.length > 0 && (
                        <div className="chat-input-container">

                            <ChatInput
                                onSend={handleSendMessage}
                                disabled={sending || !repositoryId}
                            />

                            <p className="input-disclaimer">
                                AI-generated responses may contain
                                inaccuracies. Verify important code details.
                            </p>

                        </div>
                    )}

                </div>

            </main>

        </div>
    );
}