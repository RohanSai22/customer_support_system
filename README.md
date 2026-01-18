# AI Customer Support System 🤖

A production-ready, multi-agent customer support system powered by Google Gemini AI, built with modern TypeScript stack.

## 🎯 Features

### Core Features ✅

- **Multi-Agent Architecture**: Router agent intelligently routes queries to specialized agents (Order, Billing, General)
- **Tool Integration**: Agents use tools to fetch real-time data from PostgreSQL database
- **Conversation Memory**: Full conversation history with context management
- **Real-time Streaming**: SSE-based streaming responses for better UX
- **Type-Safe RPC**: Hono-based API with full type safety

### Bonus Features ⭐

- **Rate Limiting**: Both per-user (10 msg/min) and per-IP (20 msg/min) limits
- **Context Compaction**: Automatic summarization when conversation exceeds 6k tokens
- **Agent Reasoning Display**: Toggle to show agent's thought process and tool usage
- **Comprehensive Testing**: Unit & integration tests using Bun test runner
- **Production Ready**: Docker setup + Vercel deployment configs
- **Beautiful UI**: Tailwind CSS with agent-specific styling and animations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  • Chat Interface with Agent Indicators                     │
│  • Real-time Message Updates                                │
│  • Reasoning & Tool Display                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/SSE
┌──────────────────▼──────────────────────────────────────────┐
│                      API (Hono)                              │
│  • Rate Limiting Middleware                                 │
│  • Chat Routes (Regular + Streaming)                        │
│  • Conversation Management                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   Agent Layer                                │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Router Agent (Gemini 2.0 Flash)                 │      │
│  │  • Analyzes query intent                          │      │
│  │  • Routes to appropriate agent                    │      │
│  └──────┬───────────────────────────────────────────┘      │
│         │                                                    │
│  ┌──────▼─────┬──────────────┬──────────────┐             │
│  │ Order Agent│ Billing Agent│ General Agent│             │
│  │ • Track    │ • Invoices   │ • FAQs       │             │
│  │ • Status   │ • Payments   │ • Info       │             │
│  │ • Delivery │ • Refunds    │ • Support    │             │
│  └────────────┴──────────────┴──────────────┘             │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│               Database (PostgreSQL)                          │
│  • Users, Orders, Invoices                                  │
│  • Conversations & Messages                                 │
│  • Rate Limits & Summaries                                  │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Tech Stack

### Monorepo

- **Turborepo**: Build system orchestration
- **Bun**: Package manager & runtime

### Backend

- **Hono**: Lightweight web framework with RPC
- **Drizzle ORM**: Type-safe database toolkit
- **PostgreSQL**: Primary database (local Docker + Supabase cloud)
- **Vercel AI SDK**: AI integration with streaming

### Frontend

- **Next.js 15**: React framework with App Router
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Beautiful icon library

### AI

- **Google Gemini 2.0 Flash**: Free-tier LLM
- **Tool Calling**: Function calling for database queries
- **Streaming**: Real-time response generation

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.0
- [Docker](https://docker.com) (for local database)
- Google AI API Key (free from [ai.google.dev](https://ai.google.dev))

### 1️⃣ Clone & Install

```bash
git clone <your-repo-url>
cd customer_support_system
bun install
```

### 2️⃣ Setup Environment Variables

```bash
# Root .env (or copy from .env.example files in each app)
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

**Edit `packages/db/.env`:**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/customer_support
```

**Edit `apps/api/.env`:**

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/customer_support
PORT=3001
```

**Edit `apps/web/.env`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3️⃣ Start Database

```bash
docker compose up -d
```

### 4️⃣ Setup Database Schema & Seed Data

```bash
# Generate migrations
bun run db:generate

# Push schema to database
bun run db:push

# Seed with 20 users, 40 orders, 100 messages
bun run db:seed
```

### 5️⃣ Start Development Servers

```bash
# Start all apps (API + Web)
bun run dev
```

- **API**: http://localhost:3001
- **Frontend**: http://localhost:3000

## 📝 Usage

1. Open http://localhost:3000
2. Select a test user (demo accounts with seeded data)
3. Start chatting! Try:
   - "Where is my order?"
   - "Show me my invoices"
   - "I need help with payment"
   - "Track my shipment"

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific package tests
cd packages/agents && bun test
cd apps/api && bun test
```

### Test Coverage

- ✅ Router agent routing logic
- ✅ Context manager token estimation
- ✅ API endpoint integration tests
- ✅ Rate limiting middleware

## 🗄️ Database Schema

### Tables

- **users**: Customer accounts
- **orders**: Order records with items, status, tracking
- **invoices**: Billing records linked to orders
- **conversations**: Chat sessions
- **messages**: Individual messages with agent metadata
- **conversation_summaries**: Auto-generated summaries for context compaction
- **rate_limits**: Rate limiting state

## 🔧 Available Scripts

```bash
# Development
bun run dev              # Start all apps in dev mode
bun run dev:api          # Start API only
bun run dev:web          # Start frontend only

# Database
bun run db:generate      # Generate Drizzle migrations
bun run db:push          # Push schema to database
bun run db:studio        # Open Drizzle Studio (GUI)
bun run db:seed          # Seed database with sample data

# Build & Deploy
bun run build            # Build all apps
bun run test             # Run all tests
bun run lint             # Lint all packages

# Clean
bun run clean            # Remove all node_modules & build artifacts
```

## 🚀 Deployment

### Vercel (Recommended)

#### Deploy API

```bash
cd apps/api
vercel
```

Set environment variables in Vercel:

- `GOOGLE_GENERATIVE_AI_API_KEY`
- `DATABASE_URL` (Supabase connection string)

#### Deploy Frontend

```bash
cd apps/web
vercel
```

Set environment variables:

- `NEXT_PUBLIC_API_URL` (your deployed API URL)

### Supabase Database Setup

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings → Database
3. Update `DATABASE_URL` in both local `.env` and Vercel
4. Run migrations: `bun run db:push`
5. Seed data: `bun run db:seed`

## 🎨 Features Deep Dive

### 1. Multi-Agent System

- **Router Agent**: Uses Gemini to classify query intent
- **Specialized Agents**: Each has unique system prompts and tools
- **Seamless Handoff**: Agents can suggest transfers if needed

### 2. Tool Integration

Agents have access to these tools:

- `getOrdersByUser`: Fetch all user orders
- `getOrderByNumber`: Specific order lookup
- `trackOrder`: Get tracking information
- `getInvoicesByUser`: Fetch user invoices
- `getInvoiceByNumber`: Specific invoice lookup
- `checkPaymentStatus`: Payment verification

### 3. Context Management

- Tracks conversation token count
- Auto-summarizes when exceeds 6k tokens
- Preserves last 5 messages + summary
- Prevents context window overflow

### 4. Rate Limiting

- **Per-User**: 10 messages/minute
- **Per-IP**: 20 messages/minute
- Database-backed (survives restarts)
- Automatic window reset

### 5. UI/UX Features

- Agent-specific badges and colors
- Typing indicators during processing
- Toggle reasoning display
- Tool call visualization
- Responsive design (mobile-ready)
- Dark mode support

## 📊 Sample Data

After seeding:

- **20 Users**: With realistic names and emails
- **40 Orders**: Various statuses (pending, shipped, delivered, etc.)
- **40 Invoices**: Linked to orders with payment info
- **~100 Messages**: Realistic conversation history

## 🔐 Environment Variables Reference

### Database

- `DATABASE_URL`: PostgreSQL connection string

### API

- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini API key
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

### Frontend

- `NEXT_PUBLIC_API_URL`: Backend API URL

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if Docker container is running
docker ps

# Restart database
docker compose down
docker compose up -d
```

### Port Already in Use

```bash
# Kill process on port 3001 (API)
npx kill-port 3001

# Kill process on port 3000 (Frontend)
npx kill-port 3000
```

### Build Errors

```bash
# Clean and reinstall
bun run clean
rm -rf node_modules bun.lockb
bun install
```

## 📹 Video Walkthrough

Record a 2-5 minute Loom video covering:

1. Architecture overview
2. Agent routing demonstration
3. Tool usage in action
4. UI features (reasoning display, agent badges)
5. Deployment setup

## 🏆 Bonus Features Implemented

- ✅ **Rate Limiting**: Per-user & per-IP with database persistence
- ✅ **Context Compaction**: Auto-summarization at 6k tokens
- ✅ **Agent Reasoning**: Display thought process & tool calls
- ✅ **Comprehensive Tests**: Unit & integration tests with Bun
- ✅ **Production Ready**: Docker, Vercel configs, error handling
- ✅ **Styled UI**: Beautiful, responsive interface with animations
- ✅ **Streaming Support**: SSE endpoint for real-time responses
- ✅ **Type Safety**: Full type safety across monorepo
- ✅ **Drizzle ORM**: Modern ORM with better performance

## 📚 Project Structure

```
customer_support_system/
├── apps/
│   ├── api/                 # Hono backend
│   │   ├── src/
│   │   │   ├── routes/      # API routes
│   │   │   ├── middleware/  # Rate limiting, etc.
│   │   │   └── index.ts     # App entry
│   │   ├── test/            # Integration tests
│   │   ├── Dockerfile       # Container config
│   │   └── vercel.json      # Deployment config
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   └── lib/         # Utilities
│       └── vercel.json      # Deployment config
├── packages/
│   ├── agents/              # AI agent logic
│   │   ├── src/
│   │   │   ├── router.ts        # Router agent
│   │   │   ├── order-agent.ts   # Order specialist
│   │   │   ├── billing-agent.ts # Billing specialist
│   │   │   ├── general-agent.ts # General support
│   │   │   └── context-manager.ts
│   │   └── test/            # Agent tests
│   └── db/                  # Database package
│       ├── src/
│       │   ├── schema/      # Drizzle schema
│       │   ├── index.ts     # DB client
│       │   └── seed.ts      # Seed script
│       └── drizzle.config.ts
├── docker-compose.yml       # Local database
├── turbo.json              # Turborepo config
└── package.json            # Root package
```

## 🤝 Contributing

This is an assignment project, but contributions and suggestions are welcome!

## 📄 License

MIT

---

Built with ❤️ using Bun, Hono, Next.js, and Gemini AI
