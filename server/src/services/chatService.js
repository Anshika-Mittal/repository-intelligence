const pool = require("../config/db");

// Get all chats belonging to a user
async function getUserChats(userSub) {
    const result = await pool.query(
        `
        SELECT
            c.id,
            c.repository_id,
            c.title,
            c.created_at,
            c.updated_at,
            COUNT(m.id)::INTEGER AS message_count
        FROM chats c
        LEFT JOIN chat_messages m
            ON c.id = m.chat_id
        WHERE c.user_sub = $1
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        `,
        [userSub]
    );

    return result.rows;
}


// Create a new chat
async function createChat(userSub, repositoryId) {
    const result = await pool.query(
        `
        INSERT INTO chats (user_sub, repository_id)
        VALUES ($1, $2)
        RETURNING *
        `,
        [userSub, repositoryId]
    );

    return result.rows[0];
}


// Get a particular chat and its messages
async function getChatById(chatId, userSub) {
    const chatResult = await pool.query(
        `
        SELECT *
        FROM chats
        WHERE id = $1 AND user_sub = $2
        `,
        [chatId, userSub]
    );

    if (!chatResult.rows.length) {
        return null;
    }

    const messagesResult = await pool.query(
        `
        SELECT id, role, content, created_at
        FROM chat_messages
        WHERE chat_id = $1
        ORDER BY created_at ASC, id ASC
        `,
        [chatId]
    );

    return {
        ...chatResult.rows[0],
        messages: messagesResult.rows
    };
}


// Save a message
async function saveMessage(chatId, role, content) {
    const result = await pool.query(
        `
        INSERT INTO chat_messages (chat_id, role, content)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [chatId, role, content]
    );

    return result.rows[0];
}


// Update chat title
async function updateChatTitle(chatId, title) {
    await pool.query(
        `
        UPDATE chats
        SET title = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [chatId, title]
    );
}


// Update chat activity
async function updateChatActivity(chatId) {
    await pool.query(
        `
        UPDATE chats
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [chatId]
    );
}


// Delete a chat
async function deleteChat(chatId, userSub) {
    const result = await pool.query(
        `
        DELETE FROM chats
        WHERE id = $1 AND user_sub = $2
        RETURNING id
        `,
        [chatId, userSub]
    );

    return result.rowCount > 0;
}


module.exports = {
    getUserChats,
    createChat,
    getChatById,
    saveMessage,
    updateChatTitle,
    updateChatActivity,
    deleteChat
};