import { describe, test, expect } from "bun:test";
import { ContextManager } from "../src/context-manager";
import type { ConversationContext, Message } from "../src/types";

describe("ContextManager", () => {
  test("should return messages when under token limit", async () => {
    const messages: Message[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ];

    const context: ConversationContext = {
      userId: "test-user",
      conversationId: "test-conv",
      messages,
    };

    const result = await ContextManager.getContext(context);
    expect(result.length).toBe(2);
    expect(result).toEqual(messages);
  });

  test("should estimate tokens correctly", () => {
    const content = "a".repeat(400); // ~100 tokens
    const estimated = Math.ceil(content.length / 4);
    expect(estimated).toBe(100);
  });

  test("should truncate long messages", () => {
    const longMessage = "a".repeat(3000);
    const truncated = ContextManager.truncateMessage(longMessage, 100);
    expect(truncated.length).toBeLessThanOrEqual(115); // 100 + "... [truncated]"
    expect(truncated).toContain("[truncated]");
  });

  test("should not truncate short messages", () => {
    const shortMessage = "Hello world";
    const result = ContextManager.truncateMessage(shortMessage, 100);
    expect(result).toBe(shortMessage);
  });
});
