import { faker } from "@faker-js/faker";
import { db, users, orders, invoices, conversations, messages } from "./index";
import { eq } from "drizzle-orm";

const orderStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const invoiceStatuses = ["paid", "pending", "overdue"];
const paymentMethods = ["credit_card", "debit_card", "paypal", "bank_transfer"];

const products = [
  { id: "1", name: 'Laptop Pro 15"', price: 1299.99 },
  { id: "2", name: "Wireless Mouse", price: 29.99 },
  { id: "3", name: "Mechanical Keyboard", price: 149.99 },
  { id: "4", name: "USB-C Hub", price: 79.99 },
  { id: "5", name: "4K Monitor", price: 599.99 },
  { id: "6", name: "Webcam HD", price: 89.99 },
  { id: "7", name: "Headphones Pro", price: 249.99 },
  { id: "8", name: "Desk Lamp LED", price: 39.99 },
  { id: "9", name: "Laptop Stand", price: 49.99 },
  { id: "10", name: "Cable Organizer", price: 19.99 },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(invoices);
  await db.delete(orders);
  await db.delete(users);

  // Create 20 users
  console.log("Creating 20 users...");
  const createdUsers = [];
  for (let i = 0; i < 20; i++) {
    const [user] = await db
      .insert(users)
      .values({
        email: faker.internet.email(),
        name: faker.person.fullName(),
      })
      .returning();
    createdUsers.push(user);
  }

  // Create 40 orders
  console.log("Creating 40 orders...");
  const createdOrders = [];
  for (let i = 0; i < 40; i++) {
    const user = faker.helpers.arrayElement(createdUsers);
    const numItems = faker.number.int({ min: 1, max: 5 });
    const orderItems = [];
    let totalAmount = 0;

    for (let j = 0; j < numItems; j++) {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 3 });
      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
      });
    }

    const status = faker.helpers.arrayElement(orderStatuses);
    const createdAt = faker.date.recent({ days: 60 });

    const [order] = await db
      .insert(orders)
      .values({
        userId: user.id,
        orderNumber: `ORD-${faker.string.alphanumeric({ length: 8, casing: "upper" })}`,
        status,
        totalAmount: totalAmount.toFixed(2),
        items: orderItems,
        shippingAddress: faker.location.streetAddress({ useFullAddress: true }),
        trackingNumber:
          status !== "pending" ? `TRK${faker.string.numeric(12)}` : null,
        estimatedDelivery:
          status === "shipped" ? faker.date.future({ years: 0.1 }) : null,
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    createdOrders.push(order);

    // Create invoice for each order
    const invoiceStatus =
      status === "delivered"
        ? "paid"
        : faker.helpers.arrayElement(invoiceStatuses);
    await db.insert(invoices).values({
      userId: user.id,
      orderId: order.id,
      invoiceNumber: `INV-${faker.string.alphanumeric({ length: 8, casing: "upper" })}`,
      amount: totalAmount.toFixed(2),
      status: invoiceStatus,
      dueDate: faker.date.future({ years: 0.05 }),
      paidAt: invoiceStatus === "paid" ? faker.date.recent({ days: 30 }) : null,
      paymentMethod:
        invoiceStatus === "paid"
          ? faker.helpers.arrayElement(paymentMethods)
          : null,
      items: orderItems,
      createdAt,
      updatedAt: createdAt,
    });
  }

  // Create 100 messages across conversations
  console.log("Creating conversations and 100 messages...");
  const sampleQueries = [
    "Where is my order?",
    "I want to track my shipment",
    "Can you help me with my invoice?",
    "I haven't received my order yet",
    "What's the status of order {orderNumber}?",
    "I need to update my shipping address",
    "Can I cancel my order?",
    "I was charged twice",
    "When will my order arrive?",
    "I need a refund",
    "My package was damaged",
    "I want to change my order",
    "Can you send me my invoice?",
    "I have a question about my bill",
    "How do I track my order?",
    "I need help with payment",
    "My order is incomplete",
    "I received the wrong item",
    "Can you expedite my shipping?",
    "I need to speak to someone about my account",
  ];

  const agentTypes = ["router", "order", "billing", "general"];
  let messageCount = 0;

  while (messageCount < 100) {
    const user = faker.helpers.arrayElement(createdUsers);
    const userOrders = createdOrders.filter((o) => o.userId === user.id);

    // Create conversation
    const [conversation] = await db
      .insert(conversations)
      .values({
        userId: user.id,
        title: faker.helpers.arrayElement(sampleQueries),
        status: faker.helpers.weightedArrayElement([
          { value: "active", weight: 0.3 },
          { value: "resolved", weight: 0.6 },
          { value: "archived", weight: 0.1 },
        ]),
      })
      .returning();

    // Add 2-5 messages per conversation
    const numMessages = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < numMessages && messageCount < 100; i++) {
      const isUser = i % 2 === 0;

      let content = "";
      let agentType = null;

      if (isUser) {
        content = faker.helpers.arrayElement(sampleQueries);
        if (userOrders.length > 0 && content.includes("{orderNumber}")) {
          const randomOrder = faker.helpers.arrayElement(userOrders);
          content = content.replace("{orderNumber}", randomOrder.orderNumber);
        }
      } else {
        agentType = faker.helpers.arrayElement(agentTypes);
        const responses = {
          router:
            "I'll help you with that. Let me route you to the right specialist.",
          order: `I can help you track your order. Your order ${userOrders.length > 0 ? userOrders[0].orderNumber : "ORD-XXXXX"} is currently ${faker.helpers.arrayElement(orderStatuses)}.`,
          billing:
            "I'm looking into your billing inquiry. Let me pull up your invoice details.",
          general: "I'm here to help! Let me assist you with your question.",
        };
        content = responses[agentType as keyof typeof responses];
      }

      await db.insert(messages).values({
        conversationId: conversation.id,
        role: isUser ? "user" : "assistant",
        content,
        agentType,
        tokens: faker.number.int({ min: 20, max: 200 }),
      });

      messageCount++;
    }
  }

  console.log("✅ Database seeded successfully!");
  console.log(
    `Created: 20 users, 40 orders, 40 invoices, ~${messageCount} messages`,
  );
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
