import { google } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";
import { db, invoices, orders, eq } from "@repo/db";
import type { AgentResponse, Message } from "./types";
import { ContextManager } from "./context-manager";

/**
 * Billing Agent - Handles invoices, payments, and billing queries
 */
export class BillingAgent {
  static readonly SYSTEM_PROMPT = `You are an expert billing and payment specialist for a customer support system.

Your capabilities:
- Look up invoices and payment status
- Explain billing details and charges
- Help with payment issues
- Provide invoice information
- Assist with refund requests

Always be professional, empathetic, and clear about financial information.
Use the available tools to fetch accurate billing data.

When responding:
1. Acknowledge the billing concern
2. Use tools to fetch actual invoice/payment data
3. Explain charges clearly
4. Offer solutions for payment issues`;

  /**
   * Process billing-related query
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
      const { text, toolCalls, usage } = await generateText({
        model: google("gemini-1.5-flash", {
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
          getInvoicesByUser: tool({
            description: "Get all invoices for the current user",
            parameters: z.object({}),
            execute: async () => {
              const userInvoices = await db.query.invoices.findMany({
                where: eq(invoices.userId, userId),
                orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
                limit: 10,
              });
              return userInvoices;
            },
          }),
          getInvoiceByNumber: tool({
            description: "Get specific invoice details by invoice number",
            parameters: z.object({
              invoiceNumber: z
                .string()
                .describe("The invoice number to look up"),
            }),
            execute: async ({ invoiceNumber }) => {
              const invoice = await db.query.invoices.findFirst({
                where: eq(invoices.invoiceNumber, invoiceNumber),
              });
              return invoice || { error: "Invoice not found" };
            },
          }),
          getOrderInvoice: tool({
            description: "Get invoice for a specific order",
            parameters: z.object({
              orderNumber: z
                .string()
                .describe("The order number to get invoice for"),
            }),
            execute: async ({ orderNumber }) => {
              // First find the order
              const order = await db.query.orders.findFirst({
                where: eq(orders.orderNumber, orderNumber),
              });

              if (!order) {
                return { error: "Order not found" };
              }

              // Then find the invoice
              const invoice = await db.query.invoices.findFirst({
                where: eq(invoices.orderId, order.id),
              });

              return invoice || { error: "Invoice not found for this order" };
            },
          }),
          checkPaymentStatus: tool({
            description: "Check payment status for an invoice",
            parameters: z.object({
              invoiceNumber: z.string().describe("The invoice number to check"),
            }),
            execute: async ({ invoiceNumber }) => {
              const invoice = await db.query.invoices.findFirst({
                where: eq(invoices.invoiceNumber, invoiceNumber),
              });

              if (!invoice) {
                return { error: "Invoice not found" };
              }

              return {
                invoiceNumber: invoice.invoiceNumber,
                status: invoice.status,
                amount: invoice.amount,
                dueDate: invoice.dueDate,
                paidAt: invoice.paidAt,
                paymentMethod: invoice.paymentMethod,
              };
            },
          }),
        },
        maxTokens: 1000,
      });

      return {
        content: text,
        agentType: "billing",
        toolCalls: toolCalls?.map((tc) => ({
          name: tc.toolName,
          arguments: tc.args,
          result: tc.result,
        })),
        reasoning: `Processed billing query. Used ${toolCalls?.length || 0} tools to fetch invoice/payment data.`,
      };
    } catch (error) {
      console.error("[BillingAgent] Processing failed:", error);
      return {
        content:
          "I apologize, but I'm having trouble accessing billing information right now. Please try again in a moment.",
        agentType: "billing",
        reasoning: `Error: ${error}`,
      };
    }
  }
}
