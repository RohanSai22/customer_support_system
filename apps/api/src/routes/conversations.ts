import { Hono } from "hono";
import { z } from "zod";
import { db, conversations, messages, users } from "@repo/db";
import { eq, desc, and } from "drizzle-orm";

export const conversationsRouter = new Hono();

// Get all conversations for a user
conversationsRouter.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");

  try {
    const userConversations = await db.query.conversations.findMany({
      where: eq(conversations.userId, userId),
      orderBy: [desc(conversations.updatedAt)],
      limit: 50,
      with: {
        messages: {
          limit: 1,
          orderBy: [desc(messages.createdAt)],
        },
      },
    });

    return c.json({ conversations: userConversations });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return c.json({ error: "Failed to fetch conversations" }, 500);
  }
});

// Get specific conversation with messages
conversationsRouter.get("/:conversationId", async (c) => {
  const conversationId = c.req.param("conversationId");

  try {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        messages: {
          orderBy: [desc(messages.createdAt)],
        },
      },
    });

    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({ conversation });
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    return c.json({ error: "Failed to fetch conversation" }, 500);
  }
});

// Delete conversation
conversationsRouter.delete("/:conversationId", async (c) => {
  const conversationId = c.req.param("conversationId");

  try {
    await db.delete(conversations).where(eq(conversations.id, conversationId));
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return c.json({ error: "Failed to delete conversation" }, 500);
  }
});

export type ConversationsRouter = typeof conversationsRouter;
