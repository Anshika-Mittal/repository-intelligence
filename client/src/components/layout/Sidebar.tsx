import {
    Plus,
    MessageSquare,
    Trash2,
    PanelLeftClose,
    Code2
} from "lucide-react";

import type { Chat } from "../../types/chat";

interface SidebarProps {
    chats: Chat[];
    activeChatId: string | null;
    onNewChat: () => void;
    onOpenChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
}

export default function Sidebar({
    chats,
    activeChatId,
    onNewChat,
    onOpenChat,
    onDeleteChat
}: SidebarProps) {

    return (
        <aside className="chat-sidebar">

            <div className="sidebar-header">
                <div className="brand">
                    <Code2 size={25} />
                    <span>Repository Intelligence</span>
                </div>

                <button className="icon-button" aria-label="Sidebar">
                    <PanelLeftClose size={19} />
                </button>
            </div>

            <button
                className="new-chat-button"
                onClick={onNewChat}
            >
                <Plus size={19} />
                New Chat
            </button>

            <div className="chat-history">

                <p className="sidebar-label">
                    YOUR CHATS
                </p>

                {chats.length === 0 ? (
                    <p className="no-chats">
                        Your conversations will appear here.
                    </p>
                ) : (
                    chats.map(chat => (
                        <div
                            key={chat.id}
                            className={`chat-history-item ${
                                activeChatId === chat.id
                                    ? "active"
                                    : ""
                            }`}
                        >
                            <button
                                className="chat-history-title"
                                onClick={() => onOpenChat(chat.id)}
                                title={chat.title}
                            >
                                <MessageSquare size={16} />

                                <span>{chat.title}</span>
                            </button>

                            <button
                                className="delete-chat-button"
                                aria-label="Delete conversation"
                                onClick={() => {
                                    if (window.confirm(
                                        "Delete this conversation?"
                                    )) {
                                        onDeleteChat(chat.id);
                                    }
                                }}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))
                )}

            </div>

        </aside>
    );
}