import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { AgentResponse, Message } from "./types";
import { ContextManager } from "./context-manager";

/**
 * General Agent - Handles general questions and queries not related to orders/billing
 */
export class GeneralAgent {
  static readonly SYSTEM_PROMPT = `You are a friendly and helpful customer support agent.

You handle general customer inquiries including:
- Product information and recommendations
- Account questions
- Company policies
- General help and guidance
- Anything not specifically related to orders or billing

Always be:
- Professional and friendly
- Clear and concise
- Helpful and solution-oriented
- Empathetic to customer needs

If a customer asks about orders or billing, politely suggest they might get better help from our specialized agents, but still try to provide basic information if you can.`;

  /**
   * Process general query
   */
  static async process(
    userQuery: string,
    userId: string,
    history: Message[] = [],
  ): Promise<AgentResponse> {
    const messages = await ContextManager.getContext({
      userId,
      conversationId: "",
      messages: history,
    });

    try {
      const { text, usage } = await generateText({
        model: google("gemini-2.5-flash"),
        system: this.SYSTEM_PROMPT,
        messages: [
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: "user",
            content: userQuery,
          },
        ],
        maxTokens: 800,
      });

      return {
        content: text,
        agentType: "general",
        reasoning:
          "Processed general customer inquiry with contextual understanding.",
      };
    } catch (error) {
      console.error("[GeneralAgent] Processing failed:", error);
      return {
        content:
          "I'm here to help! Could you please rephrase your question or provide more details?",
        agentType: "general",
        reasoning: `Error: ${error}`,
      };
    }
  }
}
