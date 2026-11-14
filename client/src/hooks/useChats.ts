import { useCallback, useEffect, useState } from "react";

import { chatService } from "../services/chatService";

import type {
    Chat,
    ChatMessage,
    ChatWithMessages
} from "../types/chat";

export function useChats() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] =
        useState<ChatWithMessages | null>(null);

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadChats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await chatService.getChats();

            setChats(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load chats"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadChats();
    }, [loadChats]);

    const startNewChat = useCallback(() => {
        setActiveChat(null);
        setError(null);
    }, []);

    const openChat = async (chatId: string) => {
        try {
            setError(null);

            const chat = await chatService.getChat(chatId);

            setActiveChat(chat);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to open chat"
            );
        }
    };

    const sendMessage = async (
        content: string,
        repositoryId: string
    ) => {
        if (sending) return;

        try {
            setSending(true);
            setError(null);

            let chat = activeChat;

            // Create chat only when first message is sent.
            if (!chat) {
                const newChat = await chatService.createChat(
                    repositoryId
                );

                chat = {
                    ...newChat,
                    messages: []
                };

                setActiveChat(chat);
            }

            const result = await chatService.sendMessage(
                chat.id,
                content
            );

            setActiveChat({
                ...chat,
                title: chat.messages.length === 0
                    ? content.slice(0, 60)
                    : chat.title,
                messages: [
                    ...chat.messages,
                    result.userMessage,
                    result.assistantMessage
                ]
            });

            await loadChats();

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to send message"
            );
        } finally {
            setSending(false);
        }
    };

    const deleteChat = async (chatId: string) => {
        try {
            await chatService.deleteChat(chatId);

            setChats(previous =>
                previous.filter(chat => chat.id !== chatId)
            );

            if (activeChat?.id === chatId) {
                setActiveChat(null);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete chat"
            );
        }
    };

    return {
        chats,
        activeChat,
        loading,
        sending,
        error,
        loadChats,
        startNewChat,
        openChat,
        sendMessage,
        deleteChat
    };
}