import { useState } from "react";

import {
    ArrowUp,
    Paperclip
} from "lucide-react";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function ChatInput({
    onSend,
    disabled = false,
    placeholder = "Ask anything about your repository..."
}: ChatInputProps) {

    const [message, setMessage] = useState("");

    const handleSubmit = () => {
        const trimmed = message.trim();

        if (!trimmed || disabled) return;

        onSend(trimmed);

        setMessage("");
    };

    return (
        <div className="chat-input-wrapper">

            <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => {
                    if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                    ) {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
                placeholder={placeholder}
                rows={2}
                disabled={disabled}
            />

            <div className="chat-input-actions">

                <button
                    className="attachment-button"
                    type="button"
                    title="Attachments (coming soon)"
                    disabled
                >
                    <Paperclip size={19} />
                </button>

                <button
                    className="send-button"
                    type="button"
                    onClick={handleSubmit}
                    disabled={!message.trim() || disabled}
                    aria-label="Send message"
                >
                    <ArrowUp size={20} />
                </button>

            </div>

        </div>
    );
}