export interface Chat {
    id: string;
    repository_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    message_count?: number;
}

export interface ChatMessage {
    id: string;
    chat_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export interface ChatWithMessages extends Chat {
    messages: ChatMessage[];
}