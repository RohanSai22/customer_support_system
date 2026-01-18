import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { AgentType, Message } from "./types";

/**
 * Router Agent - Determines which specialized agent should handle the user's query
 */
export class RouterAgent {
  static readonly SYSTEM_PROMPT = `You are a routing classifier. Respond with ONLY ONE WORD.

Rules:
- If query mentions: order, tracking, shipment, delivery, shipping → Reply: ORDER
- If query mentions: invoice, payment, bill, refund, charge, billing → Reply: BILLING  
- For anything else → Reply: GENERAL

RESPOND WITH ONLY ONE WORD: ORDER, BILLING, or GENERAL. NO EXPLANATIONS.`;

  /**
   * Route the user query to the appropriate agent
   */
  static async route(
    userQuery: string,
    history: Message[] = [],
  ): Promise<AgentType> {
    try {
      const { text, usage } = await generateText({
        model: google("gemini-3-flash-preview"),
        prompt: `Classify this query. Respond with only ONE word: ORDER, BILLING, or GENERAL.\n\nQuery: "${userQuery}"\n\nClassification:`,
        maxTokens: 5,
        temperature: 0,
      });

      const response = text.trim().toUpperCase();

      console.log(`[Router] Query: "${userQuery}" → AI Response: "${response}"`);

      // Map response to agent type
      if (response.includes("ORDER")) {
        return "order";
      } else if (response.includes("BILLING")) {
        return "billing";
      } else {
        return "general";
      }
    } catch (error) {
      console.error("[Router] Routing failed:", error);
      // Default to general agent on error
      return "general";
    }
  }
}
