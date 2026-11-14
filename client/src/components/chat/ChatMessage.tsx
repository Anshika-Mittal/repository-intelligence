import { Bot, User } from "lucide-react";

import type { ChatMessage as Message } from "../../types/chat";

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({
    message
}: ChatMessageProps) {

    const isUser = message.role === "user";

    return (
        <div className={`message-row ${
            isUser ? "user-message" : "assistant-message"
        }`}>

            <div className="message-avatar">
                {isUser
                    ? <User size={19} />
                    : <Bot size={19} />
                }
            </div>

            <div className="message-content">
                <strong>
                    {isUser ? "You" : "Repository Intelligence"}
                </strong>

                <p>{message.content}</p>
            </div>

        </div>
    );
}