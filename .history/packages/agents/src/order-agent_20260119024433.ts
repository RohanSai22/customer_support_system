import { google } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";
import { db, orders, eq } from "@repo/db";
import type { AgentResponse, Message } from "./types";
import { ContextManager } from "./context-manager";

/**
 * Order Agent - Handles order tracking, shipping, and order-related queries
 */
export class OrderAgent {
  static readonly SYSTEM_PROMPT = `You are an expert order tracking and shipping specialist for a customer support system.

Your capabilities:
- Track order status and shipping information
- Provide delivery estimates
- Look up orders by order number
- Check order details and items
- Explain shipping and tracking information

Always be helpful, professional, and provide specific details when available.
If you need to look up order information, use the available tools.

When responding:
1. Greet the customer warmly
2. Use tools to fetch real data
3. Provide clear, actionable information
4. Offer next steps if needed`;

  /**
   * Process order-related query
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
      const { text, toolCalls, usage, experimental_providerMetadata } =
        await generateText({
          model: google("gemini-2.5-flash", {
            structuredOutputs: false,
          }),
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
          tools: {
            getOrdersByUser: tool({
              description: "Get all orders for the current user",
              parameters: z.object({}),
              execute: async () => {
                const userOrders = await db.query.orders.findMany({
                  where: eq(orders.userId, userId),
                  orderBy: (orders, { desc }) => [desc(orders.createdAt)],
                  limit: 10,
                });
                return userOrders;
              },
            }),
            getOrderByNumber: tool({
              description: "Get specific order details by order number",
              parameters: z.object({
                orderNumber: z.string().describe("The order number to look up"),
              }),
              execute: async ({ orderNumber }) => {
                const order = await db.query.orders.findFirst({
                  where: eq(orders.orderNumber, orderNumber),
                });
                return order || { error: "Order not found" };
              },
            }),
            trackOrder: tool({
              description: "Get tracking information for an order",
              parameters: z.object({
                orderNumber: z.string().describe("The order number to track"),
              }),
              execute: async ({ orderNumber }) => {
                const order = await db.query.orders.findFirst({
                  where: eq(orders.orderNumber, orderNumber),
                });

                if (!order) {
                  return { error: "Order not found" };
                }

                return {
                  orderNumber: order.orderNumber,
                  status: order.status,
                  trackingNumber: order.trackingNumber,
                  estimatedDelivery: order.estimatedDelivery,
                  shippingAddress: order.shippingAddress,
                };
              },
            }),
          },
          maxTokens: 1000,
        });

      return {
        content: text,
        agentType: "order",
        toolCalls: toolCalls?.map((tc) => ({
          name: tc.toolName,
          arguments: tc.args,
          result: tc.result,
        })),
        reasoning: `Analyzed query for order-related information. Used ${toolCalls?.length || 0} tools.`,
      };
    } catch (error) {
      console.error("[OrderAgent] Processing failed:", error);
      return {
        content:
          "I apologize, but I'm having trouble accessing order information right now. Please try again in a moment.",
        agentType: "order",
        reasoning: `Error: ${error}`,
      };
    }
  }
}
