# Shopping Agent AI

An agentic commerce experience using commercetools as the headless commerce backend, connected via Model Context Protocol (MCP) to an AI assistant built with Vercel AI SDK.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   MCP Server    │────▶│  commercetools  │
│  (Vercel AI SDK)│     │   (Port 8888)   │     │    Commerce     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
   Google Gemini
```

- **Frontend**: Next.js 16 with React Server Components, Generative UI
- **AI**: Vercel AI SDK with Google Gemini
- **Connectivity**: commercetools MCP server (Streamable HTTP)
- **Backend**: commercetools Composable Commerce

## Key Features

- **Intelligent Transactional Agents**: Agents that can mutate state—creating carts, updating profiles, initiating orders
- **Generative UI**: Interactive React components (Product Cards, Cart views) rendered directly in chat
- **MCP Tools**: Product search, cart management, shipping methods, order creation

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn
- commercetools project credentials
- Google AI API key

### Environment Setup

**apps/mcp/.env.local**:
```
PROJECT_KEY=your-project-key
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
AUTH_URL=https://auth.europe-west1.gcp.commercetools.com
API_URL=https://api.europe-west1.gcp.commercetools.com
```

**apps/web/.env.local**:
```
MCP_URL=http://localhost:8888/mcp
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
```

### Running Locally

```bash
# Install dependencies
yarn install

# Start MCP server (terminal 1)
cd apps/mcp && yarn dev

# Start web app (terminal 2)
cd apps/web && yarn dev
```

Open http://localhost:3000

## Project Structure

```
apps/
├── mcp/                    # commercetools MCP server
└── web/                    # Next.js frontend
    ├── actions/            # Server actions
    ├── app/                # Next.js app router
    ├── components/
    │   ├── ui/             # Generic UI components
    │   ├── chat/           # Chat components
    │   └── commerce/       # Product/Cart components
    ├── hooks/              # Custom React hooks
    ├── lib/                # Utilities (MCP client, commerce helpers)
    └── types/              # TypeScript types
```

## Scripts

```bash
yarn dev          # Start development servers
yarn build        # Build for production
yarn test         # Run tests (watch mode)
yarn test:run     # Run tests once
yarn lint         # Run ESLint
```

## CI/CD

GitHub Actions runs on every push/PR to `main`:
- Type checking
- Linting
- Tests
- Build verification


