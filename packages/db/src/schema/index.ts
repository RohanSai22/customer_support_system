import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  decimal,
  integer,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
);

// Orders Table
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    status: varchar("status", { length: 50 }).notNull(), // 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    items: jsonb("items").notNull(), // Array of { productId, productName, quantity, price }
    shippingAddress: text("shipping_address").notNull(),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    estimatedDelivery: timestamp("estimated_delivery"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    orderNumberIdx: index("orders_order_number_idx").on(table.orderNumber),
    statusIdx: index("orders_status_idx").on(table.status),
  }),
);

// Invoices Table
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(), // 'paid', 'pending', 'overdue', 'cancelled'
    dueDate: timestamp("due_date").notNull(),
    paidAt: timestamp("paid_at"),
    paymentMethod: varchar("payment_method", { length: 50 }),
    items: jsonb("items").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("invoices_user_id_idx").on(table.userId),
    invoiceNumberIdx: index("invoices_invoice_number_idx").on(
      table.invoiceNumber,
    ),
    statusIdx: index("invoices_status_idx").on(table.status),
  }),
);

// Conversations Table
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    status: varchar("status", { length: 50 }).default("active").notNull(), // 'active', 'resolved', 'archived'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("conversations_user_id_idx").on(table.userId),
  }),
);

// Messages Table
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull(), // 'user', 'assistant', 'system'
    content: text("content").notNull(),
    agentType: varchar("agent_type", { length: 50 }), // 'router', 'order', 'billing', 'general'
    toolCalls: jsonb("tool_calls"), // Array of tool calls made
    reasoning: text("reasoning"), // Agent's reasoning process
    tokens: integer("tokens"), // Token count
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIdx: index("messages_conversation_id_idx").on(
      table.conversationId,
    ),
    roleIdx: index("messages_role_idx").on(table.role),
  }),
);

// Conversation Summaries (for context compaction)
export const conversationSummaries = pgTable(
  "conversation_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    messageCount: integer("message_count").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIdx: index("summaries_conversation_id_idx").on(
      table.conversationId,
    ),
  }),
);

// Rate Limiting Table
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(), // userId or IP
    type: varchar("type", { length: 50 }).notNull(), // 'user' or 'ip'
    count: integer("count").default(0).notNull(),
    windowStart: timestamp("window_start").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    identifierTypeIdx: index("rate_limits_identifier_type_idx").on(
      table.identifier,
      table.type,
    ),
  }),
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  invoices: many(invoices),
  conversations: many(conversations),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  order: one(orders, { fields: [invoices.orderId], references: [orders.id] }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    messages: many(messages),
    summaries: many(conversationSummaries),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const summariesRelations = relations(
  conversationSummaries,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationSummaries.conversationId],
      references: [conversations.id],
    }),
  }),
);
