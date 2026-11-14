const chatService = require("../services/chatService");

const {
    generateAgentResponse
} = require("../services/agentService");


// GET /api/chats
async function getChats(req, res) {
    try {
        const userSub = req.session.user.sub;

        const chats = await chatService.getUserChats(userSub);

        res.json({
            success: true,
            chats
        });

    } catch (error) {
        console.error("Get chats error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch chats"
        });
    }
}


// POST /api/chats
async function createChat(req, res) {
    try {
        const userSub = req.session.user.sub;

        const { repositoryId } = req.body;

        if (!repositoryId) {
            return res.status(400).json({
                success: false,
                message: "Repository ID is required"
            });
        }

        // TODO: Verify that this repository belongs to
        // the authenticated user before creating the chat.

        const chat = await chatService.createChat(
            userSub,
            repositoryId
        );

        res.status(201).json({
            success: true,
            chat
        });

    } catch (error) {
        console.error("Create chat error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create chat"
        });
    }
}


// GET /api/chats/:chatId
async function getChat(req, res) {
    try {
        const userSub = req.session.user.sub;
        const { chatId } = req.params;

        const chat = await chatService.getChatById(
            chatId,
            userSub
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        res.json({
            success: true,
            chat
        });

    } catch (error) {
        console.error("Get chat error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch chat"
        });
    }
}


// POST /api/chats/:chatId/messages
async function sendMessage(req, res) {
    try {
        const userSub = req.session.user.sub;
        const { chatId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty"
            });
        }

        const chat = await chatService.getChatById(
            chatId,
            userSub
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        // Save user message
        const userMessage = await chatService.saveMessage(
            chatId,
            "user",
            content.trim()
        );

        // Generate title from the first user message
        if (chat.messages.length === 0) {
            const title = content.trim().slice(0, 60);

            await chatService.updateChatTitle(
                chatId,
                title
            );
        }

        // Generate AI response
        const aiResponse = await generateAgentResponse({
            question: content.trim(),
            repositoryId: chat.repository_id,
            chatId,
            conversationHistory: chat.messages
        });

        // Save assistant message
        const assistantMessage = await chatService.saveMessage(
            chatId,
            "assistant",
            aiResponse
        );

        await chatService.updateChatActivity(chatId);

        res.json({
            success: true,
            userMessage,
            assistantMessage
        });

    } catch (error) {
        console.error("Send message error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate response"
        });
    }
}


// DELETE /api/chats/:chatId
async function removeChat(req, res) {
    try {
        const userSub = req.session.user.sub;

        const deleted = await chatService.deleteChat(
            req.params.chatId,
            userSub
        );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        res.json({
            success: true,
            message: "Chat deleted"
        });

    } catch (error) {
        console.error("Delete chat error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete chat"
        });
    }
}


module.exports = {
    getChats,
    createChat,
    getChat,
    sendMessage,
    removeChat
};