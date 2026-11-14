import { useEffect, useRef } from "react";

import type { ChatMessage as Message } from "../../types/chat";

import ChatMessage from "./ChatMessage";

interface ChatWindowProps {
    messages: Message[];
    sending: boolean;
}

export default function ChatWindow({
    messages,
    sending
}: ChatWindowProps) {

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, sending]);

    return (
        <div className="chat-window">

            <div className="messages-container">

                {messages.map(message => (
                    <ChatMessage
                        key={message.id}
                        message={message}
                    />
                ))}

                {sending && (
                    <div className="typing-indicator">
                        Repository Intelligence is thinking...
                    </div>
                )}

                <div ref={bottomRef} />

            </div>

        </div>
    );
}