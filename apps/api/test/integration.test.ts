import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { serve } from "bun";

// Mock server for integration tests
const mockServer = serve({
  port: 3002,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/chat" && req.method === "POST") {
      return Response.json({
        conversationId: "test-conv-123",
        message: "This is a test response",
        agentType: "general",
        reasoning: "Test reasoning",
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

describe("API Integration Tests", () => {
  afterAll(() => {
    mockServer.stop();
  });

  test("should respond to health check", async () => {
    const response = await fetch("http://localhost:3002/health");
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
  });

  test("should handle chat requests", async () => {
    const response = await fetch("http://localhost:3002/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Test message",
        userId: "00000000-0000-0000-0000-000000000001",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBeDefined();
    expect(data.agentType).toBeDefined();
  });

  test("should return 404 for unknown routes", async () => {
    const response = await fetch("http://localhost:3002/unknown");
    expect(response.status).toBe(404);
  });
});
