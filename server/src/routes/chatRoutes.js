const express = require("express");

const router = express.Router();

const chatController = require("../controllers/chatController");

const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

router.get("/", chatController.getChats);

router.post("/", chatController.createChat);

router.get("/:chatId", chatController.getChat);

router.post(
    "/:chatId/messages",
    chatController.sendMessage
);

router.delete("/:chatId", chatController.removeChat);

module.exports = router;