# Loom Video Script - Customer Support System

## Introduction (30s)

"Hi! I'm going to walk you through my AI-powered customer support system built for the Applied AI Research Intern assignment. This is a production-ready, multi-agent system powered by Google Gemini AI."

## Architecture Overview (1 min)

"The system uses a Turborepo monorepo with:

- A Hono backend API with full type safety
- Next.js frontend with a beautiful UI
- PostgreSQL database with Drizzle ORM
- Three specialized AI agents plus a router

The router agent uses Gemini to classify user queries and routes them to:

- Order Agent - for tracking and shipping
- Billing Agent - for invoices and payments
- General Agent - for everything else

All agents use Gemini 2.0 Flash and have access to database tools for real-time data."

## Live Demo (2 min)

"Let me show you the system in action.

[Show frontend]

- Beautiful responsive UI with agent-specific badges
- Toggle to show agent reasoning and tool calls
- Real-time message updates

[Demo query 1: "Where is my order?"]

- Watch the router classify this as an ORDER query
- Order agent activates and uses the getOrdersByUser tool
- Returns real order data from PostgreSQL
- See the reasoning: 'Used 1 tool to fetch order data'

[Demo query 2: "I need my invoice"]

- Router sends to BILLING agent
- Billing agent uses getInvoicesByUser tool
- Returns invoice details with payment status

[Demo query 3: "What products do you sell?"]

- Router sends to GENERAL agent
- General agent provides helpful response without tools

[Show reasoning toggle]

- Enable to see agent's thought process
- See which tools were called
- Understand the routing decision"

## Bonus Features (1 min)

"I implemented all the bonus features:

1. Rate Limiting - Both per-user (10 msg/min) and per-IP (20 msg/min)
2. Context Management - Auto-summarization when conversation exceeds 6k tokens
3. Agent Reasoning Display - Toggle to show thought process
4. Comprehensive Tests - Unit & integration tests with Bun
5. Production Ready - Docker setup, Vercel configs, error handling
6. Beautiful UI - Tailwind CSS with animations and dark mode

The database has 20 seeded users, 40 orders, 40 invoices, and 100+ messages for realistic testing."

## Deployment (30s)

"The system is deployment-ready:

- Docker Compose for local development
- Vercel deployment configs for both frontend and API
- Supabase integration for cloud PostgreSQL
- Environment variable templates
- Complete documentation in the README

Everything is type-safe, tested, and production-quality."

## Closing (10s)

"That's the complete system! Check out the README for setup instructions and code documentation. Thanks for watching!"

---

## Key Points to Emphasize

✅ Multi-agent architecture with intelligent routing
✅ Real-time tool usage with database queries
✅ All bonus features implemented
✅ Production-ready with tests, Docker, deployment configs
✅ Beautiful, responsive UI with agent indicators
✅ Type-safe across the entire stack
✅ Well-documented and easy to set up

## Demo Tips

- Keep browser at comfortable zoom
- Show both light and dark mode
- Toggle reasoning on/off to show the feature
- Use varied queries to show different agents
- Point out the agent badges and colors
- Show the seed data quality (realistic orders/invoices)
- Briefly show code structure if time permits
