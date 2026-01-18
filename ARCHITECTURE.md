# 🏛️ System Architecture

## High-Level Overview

```
┌────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│                     (http://localhost:3000)                     │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS + SSE
                        │
┌───────────────────────▼────────────────────────────────────────┐
│                      Next.js Frontend                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ChatInterface Component                                  │ │
│  │  • Message Display                                        │ │
│  │  • Agent Badges (Order/Billing/General)                  │ │
│  │  • Reasoning Toggle                                       │ │
│  │  • Real-time Updates                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        │ REST API / Server-Sent Events
                        │
┌───────────────────────▼────────────────────────────────────────┐
│                     Hono Backend API                            │
│                  (http://localhost:3001)                        │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Middleware Layer                                         │ │
│  │  ├─ CORS                                                  │ │
│  │  ├─ Logger                                                │ │
│  │  └─ Rate Limiter (10/min user, 20/min IP)               │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  API Routes                                               │ │
│  │  ├─ POST /api/chat         (regular response)           │ │
│  │  ├─ POST /api/chat/stream  (SSE streaming)              │ │
│  │  ├─ GET  /api/conversations/:id                          │ │
│  │  └─ GET  /health                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        │ Function Calls
                        │
┌───────────────────────▼────────────────────────────────────────┐
│                    Agent Orchestration                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Router Agent (Gemini 2.0 Flash)                         │ │
│  │  • Analyzes user query                                   │ │
│  │  • Classifies intent: ORDER | BILLING | GENERAL         │ │
│  │  • Routes to appropriate specialist                      │ │
│  └───────────┬──────────────────────────────────────────────┘ │
│              │                                                  │
│  ┌───────────▼───────────┬──────────────┬──────────────────┐ │
│  │   Order Agent         │ Billing Agent│  General Agent    │ │
│  │                       │              │                   │ │
│  │ System Prompt:        │ System:      │ System:           │ │
│  │ "Track orders..."     │ "Handle      │ "General          │ │
│  │                       │  invoices"   │  support"         │ │
│  │ Tools:                │ Tools:       │ Tools:            │ │
│  │ • getOrdersByUser     │ • getInvoices│ (None - uses      │ │
│  │ • getOrderByNumber    │ • getInvoice │  general          │ │
│  │ • trackOrder          │ • getOrder   │  knowledge)       │ │
│  │                       │   Invoice    │                   │ │
│  │                       │ • checkPaymt │                   │ │
│  └───────────┬───────────┴──────┬───────┴──────┬────────────┘ │
│              │                  │              │               │
│              └──────────────────┴──────────────┘               │
│                         │                                       │
│                  Tool Execution                                 │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ SQL Queries (Drizzle ORM)
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   PostgreSQL Database                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tables:                                                  │  │
│  │  ├─ users                (customer accounts)            │  │
│  │  ├─ orders               (order records + tracking)     │  │
│  │  ├─ invoices             (billing records)              │  │
│  │  ├─ conversations        (chat sessions)                │  │
│  │  ├─ messages             (with agent metadata)          │  │
│  │  ├─ conversation_summaries (context compaction)         │  │
│  │  └─ rate_limits          (rate limiting state)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Hosted:                                                         │
│  • Local: Docker (postgres:16-alpine)                           │
│  • Production: Supabase / Neon / Railway                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

### 1. User Sends Message

```
User: "Where is my order?"
  ↓
Frontend: ChatInterface
  ↓
POST /api/chat
  body: { message, userId, conversationId }
```

### 2. Rate Limiting Check

```
Rate Limiter Middleware
  ↓
Check user rate (10/min) ✓
Check IP rate (20/min) ✓
  ↓
Continue or Return 429
```

### 3. Router Agent Classification

```
Router Agent
  ↓
System Prompt: "You are a routing agent..."
User Query: "Where is my order?"
  ↓
Gemini Analysis
  ↓
Decision: "ORDER" → route to Order Agent
```

### 4. Specialist Agent Processing

```
Order Agent
  ↓
System Prompt: "You are an order tracking specialist..."
  ↓
Available Tools:
  - getOrdersByUser()
  - getOrderByNumber(orderNumber)
  - trackOrder(orderNumber)
  ↓
Gemini decides: "Use getOrdersByUser tool"
  ↓
Execute Tool → Query Database
  ↓
Result: [{ orderNumber: "ORD-ABC123", status: "shipped", ... }]
  ↓
Gemini generates response:
"I found your order ORD-ABC123. It's currently shipped and
 expected to arrive on Jan 25th. Tracking: TRK123456789"
```

### 5. Save to Database

```
Insert Message
  ↓
conversationId: "uuid-123"
role: "assistant"
content: "I found your order..."
agentType: "order"
reasoning: "Used getOrdersByUser tool to fetch data"
toolCalls: [{ name: "getOrdersByUser", ... }]
```

### 6. Return to Frontend

```
Response:
{
  conversationId: "uuid-123",
  message: "I found your order...",
  agentType: "order",
  reasoning: "Used getOrdersByUser...",
  toolCalls: [...]
}
  ↓
Frontend renders:
  • Message bubble
  • Order Agent badge (blue)
  • Reasoning (if toggled on)
  • Tool calls (if toggled on)
```

---

## Context Management Flow

```
New Message Arrives
  ↓
ContextManager.getContext()
  ↓
Estimate total tokens
  ↓
If > 6000 tokens:
  ├─ Keep last 5 messages
  ├─ Summarize older messages
  │   ↓
  │   Gemini: "Summarize this conversation..."
  │   ↓
  │   Summary: "User asked about order tracking..."
  ├─ Return [summary_message, ...recent_5_messages]
  └─ Save summary to conversation_summaries table
Else:
  └─ Return all messages
```

---

## Agent Tool Execution

```
Agent receives query
  ↓
Gemini analyzes: "I need to fetch order data"
  ↓
Tool Selection: getOrdersByUser
  ↓
Drizzle ORM Query:
  db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: desc(orders.createdAt),
  })
  ↓
PostgreSQL executes:
  SELECT * FROM orders WHERE user_id = 'uuid' ORDER BY created_at DESC
  ↓
Results returned to Gemini
  ↓
Gemini crafts natural language response
  ↓
Response sent to user
```

---

## Streaming Flow (Bonus)

```
POST /api/chat/stream
  ↓
streamText() from Vercel AI SDK
  ↓
Gemini generates response token-by-token
  ↓
Server-Sent Events (SSE)
  data: { token: "I" }
  data: { token: "found" }
  data: { token: "your" }
  ...
  ↓
Frontend receives and displays in real-time
  ↓
onFinish: Save complete message to DB
```

---

## Data Model Relationships

```
User (1) ──────< Orders (many)
  │
  └──────< Invoices (many)
  │
  └──────< Conversations (many)

Order (1) ──────< Invoice (1) [optional]

Conversation (1) ──────< Messages (many)
  │
  └──────< ConversationSummaries (many)
```

---

## Deployment Architecture

```
┌─────────────────────────────────────┐
│         Vercel Edge Network          │
│  ┌─────────────────────────────┐    │
│  │   Next.js Frontend          │    │
│  │   (Static + SSR)            │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │   Hono API                  │    │
│  │   (Edge Functions)          │    │
│  └─────────────────────────────┘    │
└─────────────┬───────────────────────┘
              │
              │ Connection Pool
              │
┌─────────────▼───────────────────────┐
│      Supabase PostgreSQL             │
│      (or Neon/Railway)               │
│  • Connection pooling                │
│  • Automatic backups                 │
│  • Global distribution               │
└──────────────────────────────────────┘

External:
  • Google AI (Gemini 2.0 Flash)
  • GitHub (source control)
```

---

## Security Layers

```
1. Environment Variables
   • API keys never in code
   • Separate .env files per environment

2. Rate Limiting
   • Per-user: 10 requests/minute
   • Per-IP: 20 requests/minute
   • Database-backed (persistent)

3. CORS
   • Whitelist specific origins
   • Credentials support

4. Input Validation
   • Zod schemas on all inputs
   • Max message length: 2000 chars

5. Database
   • Parameterized queries (Drizzle)
   • No SQL injection risk
   • Foreign key constraints

6. Error Handling
   • Try-catch blocks
   • Safe error messages
   • Logging without exposing secrets
```

---

## Scalability Considerations

### Horizontal Scaling

- ✅ Stateless API (can run multiple instances)
- ✅ Database connection pooling
- ✅ Edge functions (Vercel)

### Caching

- ✅ Conversation summaries (reduce repeated summarization)
- 🔄 Could add: Response caching for common queries
- 🔄 Could add: Redis for session state

### Performance

- ✅ Database indexes on common queries
- ✅ Pagination on conversation history
- ✅ Token estimation (prevent over-fetching)
- ✅ Streaming responses (better UX)

### Monitoring

- 🔄 Could add: Sentry for error tracking
- 🔄 Could add: LogRocket for session replay
- 🔄 Could add: Vercel Analytics
- ✅ Console logging for debugging

---

This architecture ensures:

- ✅ Type safety across the stack
- ✅ Scalable agent system
- ✅ Efficient database access
- ✅ Great user experience
- ✅ Production-ready reliability
