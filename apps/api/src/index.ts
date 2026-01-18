import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { chatRouter } from "./routes/chat";
import { conversationsRouter } from "./routes/conversations";
import { healthRouter } from "./routes/health";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend-domain.vercel.app"]
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  }),
);

// Routes
app.route("/health", healthRouter);
app.route("/api/chat", chatRouter);
app.route("/api/conversations", conversationsRouter);

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = parseInt(process.env.PORT || "3001");

const server = Bun.serve({
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
});

console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`✅ API ready at http://localhost:${port}/health`);
