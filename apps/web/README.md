# AI Shop POC (GenUI + MCP)

> **Note**: Development of AI SDK RSC is currently paused. For more information, see [Migrating from AI SDK RSC](https://sdk.vercel.ai/docs/ai-sdk-rsc/migrating-to-ui#background).

This POC uses the Vercel AI SDK with Next.js and MCP tools to search products and manage a cart via commercetools.

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-sdk-preview-rsc-genui&env=OPENAI_API_KEY&envDescription=API%20keys%20needed%20for%20application&envLink=platform.openai.com)

## How to use

Run [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init), [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/), or [pnpm](https://pnpm.io) to bootstrap the example:

```bash
npx create-next-app --example https://github.com/vercel-labs/ai-sdk-preview-rsc-genui ai-sdk-preview-rsc-genui-example
```

```bash
yarn create next-app --example https://github.com/vercel-labs/ai-sdk-preview-rsc-genui ai-sdk-preview-rsc-genui-example
```

```bash
pnpm create next-app --example https://github.com/vercel-labs/ai-sdk-preview-rsc-genui ai-sdk-preview-rsc-genui-example
```

To run locally you need to:

1. Obtain a Google AI API key.
2. Have a remote MCP server URL for commercetools.
3. Create `.env.local` from `.env.example` and fill in values.
4. `npm install`
5. `npm run dev`

Optional:
- Use `MCP_TOOL_ALLOWLIST` to restrict tools (improves speed and reliability).
- Configure your Commerce MCP server with `toolOutputFormat=json` so the UI can
  safely parse product and cart responses.


## Learn More

To learn more about Vercel AI SDK or Next.js take a look at the following resources:

- [Vercel AI SDK docs](https://sdk.vercel.ai/docs)
- [Vercel AI Playground](https://play.vercel.ai)
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
