import { apiRequest } from "./api";

import type {
    Chat,
    ChatWithMessages,
    ChatMessage
} from "../types/chat";

export const chatService = {

    async getChats(): Promise<Chat[]> {
        const data = await apiRequest<{
            success: boolean;
            chats: Chat[];
        }>("/api/chats");

        return data.chats;
    },

    async createChat(
        repositoryId: string
    ): Promise<Chat> {
        const data = await apiRequest<{
            success: boolean;
            chat: Chat;
        }>("/api/chats", {
            method: "POST",
            body: JSON.stringify({
                repositoryId
            })
        });

        return data.chat;
    },

    async getChat(
        chatId: string
    ): Promise<ChatWithMessages> {
        const data = await apiRequest<{
            success: boolean;
            chat: ChatWithMessages;
        }>(`/api/chats/${chatId}`);

        return data.chat;
    },

    async sendMessage(
        chatId: string,
        content: string
    ): Promise<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
    }> {
        const data = await apiRequest<{
            success: boolean;
            userMessage: ChatMessage;
            assistantMessage: ChatMessage;
        }>(`/api/chats/${chatId}/messages`, {
            method: "POST",
            body: JSON.stringify({ content })
        });

        return {
            userMessage: data.userMessage,
            assistantMessage: data.assistantMessage
        };
    },

    async deleteChat(chatId: string): Promise<void> {
        await apiRequest(
            `/api/chats/${chatId}`,
            { method: "DELETE" }
        );
    }
};