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
    const query = userQuery.toLowerCase();

    // Rule-based routing for reliable classification
    const orderKeywords = [
      "order",
      "tracking",
      "shipment",
      "delivery",
      "shipping",
      "track",
      "package",
      "dispatch",
    ];
    const billingKeywords = [
      "invoice",
      "payment",
      "bill",
      "refund",
      "charge",
      "billing",
      "paid",
      "pay",
      "receipt",
    ];

    // Check for order-related keywords
    if (orderKeywords.some((keyword) => query.includes(keyword))) {
      console.log(
        `[Router] Query: "${userQuery}" → Routed to: ORDER (keyword match)`,
      );
      return "order";
    }

    // Check for billing-related keywords
    if (billingKeywords.some((keyword) => query.includes(keyword))) {
      console.log(
        `[Router] Query: "${userQuery}" → Routed to: BILLING (keyword match)`,
      );
      return "billing";
    }

    // Default to general for everything else
    console.log(
      `[Router] Query: "${userQuery}" → Routed to: GENERAL (default)`,
    );
    return "general";
  }
}
