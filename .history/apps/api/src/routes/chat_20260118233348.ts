import { Hono } from "hono";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { db, conversations, messages, users } from "@repo/db";
import { eq, desc } from "drizzle-orm";
import {
  RouterAgent,
  OrderAgent,
  BillingAgent,
  GeneralAgent,
  type Message as AgentMessage,
} from "@repo/agents";
import { rateLimiter } from "../middleware/rate-limit";

export const chatRouter = new Hono();

// Validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  userId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
});

// Chat endpoint with streaming
chatRouter.post("/", rateLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const { message, userId, conversationId } = chatRequestSchema.parse(body);

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });
      if (!conversation || conversation.userId !== userId) {
        return c.json({ error: "Conversation not found" }, 404);
      }
    } else {
      [conversation] = await db
        .insert(conversations)
        .values({
          userId,
          title: message.substring(0, 100),
        })
        .returning();
    }

    // Get conversation history
    const history = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversation.id),
      orderBy: [desc(messages.createdAt)],
      limit: 20,
    });

    const agentHistory: AgentMessage[] = history.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      agentType: m.agentType as any,
      reasoning: m.reasoning || undefined,
    }));

    // Save user message
    await db.insert(messages).values({
      conversationId: conversation.id,
      role: "user",
      content: message,
    });

    // Route to appropriate agent
    const routedAgent = await RouterAgent.route(message, agentHistory);

    // Process with appropriate agent
    let response;
    switch (routedAgent) {
      case "order":
        response = await OrderAgent.process(message, userId, agentHistory);
        break;
      case "billing":
        response = await BillingAgent.process(message, userId, agentHistory);
        break;
      default:
        response = await GeneralAgent.process(message, userId, agentHistory);
    }

    // Save assistant response
    await db.insert(messages).values({
      conversationId: conversation.id,
      role: "assistant",
      content: response.content,
      agentType: response.agentType,
      reasoning: response.reasoning,
      toolCalls: response.toolCalls as any,
    });

    // Return response
    return c.json({
      conversationId: conversation.id,
      message: response.content,
      agentType: response.agentType,
      reasoning: response.reasoning,
      toolCalls: response.toolCalls,
    });
  } catch (error: any) {
    console.error("Chat error:", error);

    if (error.name === "ZodError") {
      return c.json({ error: "Invalid request", details: error.errors }, 400);
    }

    return c.json({ error: "Failed to process message" }, 500);
  }
});

// Streaming endpoint (bonus feature)
chatRouter.post("/stream", rateLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const { message, userId, conversationId } = chatRequestSchema.parse(body);

    // Verify user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });
    } else {
      [conversation] = await db
        .insert(conversations)
        .values({
          userId,
          title: message.substring(0, 100),
        })
        .returning();
    }

    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    // Get history
    const history = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversation.id),
      orderBy: [desc(messages.createdAt)],
      limit: 10,
    });

    // Save user message
    await db.insert(messages).values({
      conversationId: conversation.id,
      role: "user",
      content: message,
    });

    // Route agent
    const routedAgent = await RouterAgent.route(message);

    const systemPrompt =
      routedAgent === "order"
        ? OrderAgent.SYSTEM_PROMPT
        : routedAgent === "billing"
          ? BillingAgent.SYSTEM_PROMPT
          : GeneralAgent.SYSTEM_PROMPT;

    // Stream response
    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: systemPrompt,
      messages: [
        ...history.reverse().map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
      maxTokens: 1000,
      onFinish: async ({ text }) => {
        // Save assistant response after streaming completes
        await db.insert(messages).values({
          conversationId: conversation.id,
          role: "assistant",
          content: text,
          agentType: routedAgent,
        });
      },
    });

    // Return SSE stream
    return c.newResponse(result.toDataStream(), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Stream error:", error);
    return c.json({ error: "Failed to stream message" }, 500);
  }
});

export type ChatRouter = typeof chatRouter;
