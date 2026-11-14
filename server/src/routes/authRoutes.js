const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

// Redirect to Cognito
router.get("/login", authController.login);

// OAuth callback
router.get("/callback", authController.callback);

// Get logged-in user
router.get("/me", authController.me);


// Logout
router.get("/logout", authController.logout);

module.exports = router;