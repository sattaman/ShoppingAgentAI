# Agentic Commerce POC

## Overview
This POC demonstrates an agentic shopping experience using commercetools as the headless commerce backend, connected via Model Context Protocol (MCP) to an AI assistant built with Vercel AI SDK.

## Architecture

- **Frontend**: Next.js 15 with React Server Components, Generative UI via Vercel AI SDK
- **AI Orchestrator**: Vercel AI SDK with Google Gemini
- **Connectivity**: commercetools Commerce MCP server (Streamable HTTP transport)
- **Commerce Backend**: commercetools Composable Commerce

## Key Concepts

**Intelligent Transactional Agents**: Unlike passive chatbots, these agents can mutate state—creating carts, updating customer profiles, and initiating orders.

**Generative UI**: The agent renders interactive React components (Product Cards, Cart views) directly in the chat stream, not just text responses.

**MCP Tools Available**:
- `product-search.read` - Search products
- `products.read` - Get product details
- `cart.create` / `cart.read` / `cart.update` - Cart management
- `shipping-methods.read` - Get shipping options
- `order.create` - Create orders

## Running Locally

```bash
# Start MCP server (port 8888)
cd apps/mcp && npm run dev

# Start web app (separate terminal)
cd apps/web && npm run dev
```

## Environment Variables

**apps/mcp/.env.local**:
- `PROJECT_KEY`, `CLIENT_ID`, `CLIENT_SECRET`, `AUTH_URL`, `API_URL`

**apps/web/.env.local**:
- `MCP_URL=http://localhost:8888/mcp`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `MCP_TOOL_ALLOWLIST` (optional)
