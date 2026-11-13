require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");

const authRoutes = require("./routes/authRoutes");

const app = express();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Required when running behind a reverse proxy
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// Session configuration
app.use(
  session({
    name: "ri.sid",

    store: new pgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),

    secret: process.env.SESSION_SECRET,

    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",

      sameSite:
        process.env.COOKIE_SAME_SITE || "lax",

      maxAge: 24 * 60 * 60 * 1000,

      path: "/",
    },
  })
);

// Authentication routes
app.use("/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Repository Intelligence API is running",
  });
});

// Protected routes example
const requireAuth = require("./middleware/requireAuth");

app.get("/api/protected", requireAuth, (req, res) => {
  res.json({
    success: true,
    message: "You have accessed a protected route",
    user: req.session.user,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

module.exports = app;