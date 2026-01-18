import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { RouterAgent } from "../src/router";

describe("RouterAgent", () => {
  test("should route order queries to order agent", async () => {
    const queries = [
      "Where is my order?",
      "Track my shipment",
      "When will my package arrive?",
    ];

    for (const query of queries) {
      const agent = await RouterAgent.route(query);
      expect(agent).toBe("order");
    }
  });

  test("should route billing queries to billing agent", async () => {
    const queries = [
      "I need my invoice",
      "I was charged twice",
      "Help with payment",
    ];

    for (const query of queries) {
      const agent = await RouterAgent.route(query);
      expect(agent).toBe("billing");
    }
  });

  test("should route general queries to general agent", async () => {
    const queries = [
      "What products do you sell?",
      "Tell me about your company",
      "How do I contact support?",
    ];

    for (const query of queries) {
      const agent = await RouterAgent.route(query);
      expect(agent).toBe("general");
    }
  });

  test("should handle empty queries gracefully", async () => {
    const agent = await RouterAgent.route("");
    expect(["order", "billing", "general"]).toContain(agent);
  });
});
