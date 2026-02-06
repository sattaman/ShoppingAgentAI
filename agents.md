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
- `product-search.read` - Search products using full-text search
- `products.read` - List/read products with filtering
- `cart.create` / `cart.read` / `cart.update` - Cart management
- `shipping-methods.read` - Get shipping options
- `order.create` - Create orders

## System Prompt Requirements

**CRITICAL**: The AI agent MUST always use these parameters when calling commercetools APIs:

### Currency & Language
- **Currency**: Always use `GBP` for prices
- **Language**: Always use `en-GB` for product names, descriptions, and attributes
- **Country**: Use `GB` for country-specific pricing

### Product Queries
When calling `list_products`:
```typescript
{
  limit: 20,
  expand: ["masterData.current.categories[*]"]
}
```

### Price Formatting
- Prices are stored as `centAmount` (e.g., 3299 = £32.99)
- Always divide by 100 and format with currency symbol: `£32.99`
- Show discounted prices when available: `£399.00 → £339.15`

### Product Search Strategy
Use `search_products` for natural language queries - pass a simple string query:
```typescript
// Examples:
"chairs"
"blue chairs"
"chairs under £100"
```

Use `list_products` for structured filtering with where clauses:
```typescript
// Filter by category
{ where: ["masterData(current(categories(id=\"category-id\")))"] }

// Filter by price range
{ where: ["masterData(current(masterVariant(prices(value(centAmount >= 1000 and centAmount <= 5000)))))"] }
```

### Example System Prompt
```
You are a helpful shopping assistant for a UK-based home decor store.

IMPORTANT RULES:
- Always show prices in GBP (£)
- Use British English (en-GB) for all product information
- Use search_products for natural language queries (e.g., "blue chairs under £100")
- Use list_products for browsing categories or fetching specific products
- Format prices correctly: divide centAmount by 100 (e.g., 3299 → £32.99)
- Show product images when available
- Mention stock availability
- Be concise but helpful

Available product categories:
- Furniture (chairs, sofas, tables)
- Home Decor (rugs, bedding)
- Kitchen (glassware, bar accessories)
```

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
