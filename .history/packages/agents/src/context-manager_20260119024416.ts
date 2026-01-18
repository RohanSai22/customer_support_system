import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { Message, ConversationContext } from "./types";

const CONTEXT_LIMIT = 8000; // tokens
const SUMMARY_TRIGGER = 6000; // trigger summarization at 6k tokens

/**
 * Manages conversation context and implements token-based summarization
 */
export class ContextManager {
  /**
   * Get conversation history with automatic summarization if needed
   */
  static async getContext(context: ConversationContext): Promise<Message[]> {
    const totalTokens = this.estimateTokens(context.messages);

    // If context is too large, summarize older messages
    if (totalTokens > SUMMARY_TRIGGER) {
      return await this.compactContext(context);
    }

    return context.messages;
  }

  /**
   * Compact context by summarizing older messages
   */
  private static async compactContext(
    context: ConversationContext,
  ): Promise<Message[]> {
    const recentMessages = context.messages.slice(-5); // Keep last 5 messages
    const oldMessages = context.messages.slice(0, -5);

    if (oldMessages.length === 0) {
      return recentMessages;
    }

    // Generate summary of old messages
    const summaryPrompt = `Summarize the following conversation history concisely, preserving key facts about orders, invoices, and user requests:

${oldMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}

Provide a brief summary (max 200 words):`;

    try {
      const { text } = await generateText({
        model: google("gemma-3-27b"),
        prompt: summaryPrompt,
        maxTokens: 300,
      });

      // Return summary + recent messages
      return [
        {
          role: "system",
          content: `Previous conversation summary: ${text}`,
        },
        ...recentMessages,
      ];
    } catch (error) {
      console.error("Failed to generate summary:", error);
      // Fallback: just return recent messages
      return recentMessages;
    }
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private static estimateTokens(messages: Message[]): number {
    const totalChars = messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0,
    );
    return Math.ceil(totalChars / 4);
  }

  /**
   * Truncate message if it exceeds max length
   */
  static truncateMessage(content: string, maxLength: number = 2000): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + "... [truncated]";
  }
}
