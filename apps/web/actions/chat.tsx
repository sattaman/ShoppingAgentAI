"use server";

import { TextStreamMessage, Message } from "@/components/chat";
import { ProductGrid } from "@/components/commerce";
import { google } from "@ai-sdk/google";
import { CoreMessage, generateId, streamText, tool, jsonSchema } from "ai";
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
} from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";
import { callMcpTool, getMcpTools } from "@/lib/mcp";
import { extractJsonFromToolContent, normalizeProducts } from "@/lib/commerce";
import { logger } from "@/lib/logger";
import { getOrCreateAnonymousId } from "@/lib/session";

// Tools that need anonymousId injected
const CART_TOOLS = ["create_cart", "read_cart", "update_cart"];

// Manual schema overrides for tools with vague schemas
const toolOverrides: Record<string, z.ZodTypeAny> = {
  search_products: z.object({
    query: z.object({
      fullText: z.object({
        field: z.string().default("name").describe('Field to search in. Use "name" for product names'),
        language: z.string().default("en-GB").describe('Language code. MUST use "en-GB" for English products'),
        value: z.string().describe('The search term, e.g., "chairs"'),
      }).describe('Full-text search query'),
    }).describe('Search query object. Example: {"fullText": {"field": "name", "language": "en-GB", "value": "chairs"}}'),
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
  }),
};

const sendMessage = async (message: string) => {
  "use server";

  logger.info("Chat request", { message });

  const aiState = getMutableAIState<typeof AI>("messages");
  const anonymousId = await getOrCreateAnonymousId();
  
  // Load MCP tools
  const mcpTools = await getMcpTools();
  logger.debug("Tools available", { count: mcpTools.tools.length, tools: mcpTools.tools.map(t => ({ name: t.name, schema: JSON.stringify(t.inputSchema) })) });

  // Convert MCP tools to AI SDK format
  const tools: Record<string, any> = {};
  for (const mcpTool of mcpTools.tools) {
    tools[mcpTool.name] = tool({
      description: mcpTool.description ?? "",
      parameters: toolOverrides[mcpTool.name] ?? jsonSchema(mcpTool.inputSchema),
      execute: async (args) => {
        // Inject anonymousId for cart operations
        const finalArgs = CART_TOOLS.includes(mcpTool.name)
          ? { ...args, anonymousId }
          : args;
        
        logger.info("Tool call", { tool: mcpTool.name, args: JSON.stringify(finalArgs) });
        const result = await callMcpTool(mcpTool.name, finalArgs);
        logger.debug("Tool response", { tool: mcpTool.name, result: JSON.stringify(result).substring(0, 200) });
        return { toolName: mcpTool.name, result };
      },
    });
  }

  // Update conversation state
  aiState.update([
    ...(aiState.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  // Set up streaming UI
  const uiStream = createStreamableUI();
  const textStream = createStreamableValue("");
  uiStream.update(<TextStreamMessage content={textStream.value} />);

  const finishWithError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Chat failed", { error: message, stack: error instanceof Error ? error.stack : undefined });
    
    const displayMsg = message.includes("quota") || message.includes("rate")
      ? "Rate limit reached. Please wait a moment and try again."
      : "Something went wrong. Please try again.";
    
    textStream.done();
    aiState.done([...(aiState.get() as CoreMessage[]), { role: "assistant", content: displayMsg }]);
    uiStream.update(<Message role="assistant" content={displayMsg} isError />);
    uiStream.done();
  };

  // Process in background
  (async () => {
    try {
      const response = await streamText({
        model: google(process.env.GOOGLE_MODEL ?? "gemini-2.5-flash"),
        system: `You are a helpful shopping assistant for a UK-based home decor store.

CRITICAL RULES:
- Always show prices in GBP (£)
- Use British English (en-GB) for all product information
- Format prices correctly: divide centAmount by 100 (e.g., 3299 → £32.99)
- Show product images when available
- Be concise but helpful

CART RULES:
- When creating a cart, ALWAYS use currency: "GBP" and country: "GB"
- Use the product's SKU or productId when adding items
- The user's anonymousId is automatically injected into cart calls
- To read the user's cart, use read_cart with where: ["anonymousId=\\"${anonymousId}\\""]
- Never ask the user for their cart ID or customer ID - use the anonymousId filter`,
        messages: aiState.get() as CoreMessage[],
        tools,
        maxSteps: 3,
      });

      let fullText = "";

      for await (const part of response.fullStream) {
        switch (part.type) {
          case "text-delta":
            fullText += part.textDelta;
            textStream.update(fullText);
            break;

          case "tool-result": {
            const { toolName, result } = part.result as { toolName: string; result: unknown };
            const parsed = extractJsonFromToolContent((result as any)?.content) ?? result;

            if (toolName.toLowerCase().includes("product")) {
              const products = normalizeProducts(parsed);
              logger.info("Products loaded", { count: products.length });
              if (products.length > 0) {
                uiStream.append(<ProductGrid title="Results" products={products} />);
              }
            }
            break;
          }

          case "error":
            return finishWithError((part as any).error);
        }
      }

      textStream.done();
      aiState.done([
        ...(aiState.get() as CoreMessage[]),
        { role: "assistant", content: fullText || "Done" },
      ]);

      if (!fullText) {
        uiStream.update(<></>);
      }
      uiStream.done();

    } catch (err) {
      finishWithError(err);
    }
  })();

  return uiStream.value;
};

export type UIState = Array<ReactNode>;
export type AIState = { chatId: string; messages: Array<CoreMessage> };

export const AI = createAI<AIState, UIState>({
  initialAIState: { chatId: generateId(), messages: [] },
  initialUIState: [],
  actions: { sendMessage },
});
