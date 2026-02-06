"use server";

import { ProductGrid, ProductGridSkeleton } from "@/components/commerce";
import { Message } from "@/components/chat";
import { google } from "@ai-sdk/google";
import { CoreMessage, generateId, streamText, tool, jsonSchema } from "ai";
import {
  createAI,
  createStreamableUI,
  getMutableAIState,
} from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";
import { callMcpTool, getMcpTools } from "@/lib/mcp";
import { extractJsonFromToolContent, normalizeProducts } from "@/lib/commerce";
import { logger } from "@/lib/logger";
import { getOrCreateAnonymousId } from "@/lib/session";
import { SHOPPING_ASSISTANT_PROMPT } from "@/lib/prompts";

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
    }).describe('Search query object'),
    productProjectionParameters: z.object({}).default({}).describe('MUST include this empty object to get full product data'),
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
  logger.info("Tools registered", { count: Object.keys(tools).length, names: Object.keys(tools) });

  // Update conversation state
  aiState.update([
    ...(aiState.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  // Set up streaming UI
  const uiStream = createStreamableUI(<div className="text-sm text-muted-foreground">Thinking...</div>);

  const finishWithError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Chat failed", { error: message, stack: error instanceof Error ? error.stack : undefined });
    
    const displayMsg = message.includes("quota") || message.includes("rate")
      ? "Rate limit reached. Please wait a moment and try again."
      : "Something went wrong. Please try again.";
    
    aiState.done([...(aiState.get() as CoreMessage[]), { role: "assistant", content: displayMsg }]);
    uiStream.done(<div className="text-sm text-red-500">{displayMsg}</div>);
  };

  // Process in background
  (async () => {
    logger.info("Starting stream processing");
    const messages = aiState.get() as CoreMessage[];
    logger.info("Messages to send", { count: messages.length, messages: JSON.stringify(messages) });
    try {
      const response = await streamText({
        model: google(process.env.GOOGLE_MODEL ?? "gemini-2.5-flash"),
        system: SHOPPING_ASSISTANT_PROMPT,
        messages,
        tools,
        maxSteps: 3,
        onStepFinish: (step) => {
          logger.debug("Step finished", { 
            finishReason: step.finishReason,
            hasToolCalls: step.toolCalls?.length ?? 0,
            hasToolResults: step.toolResults?.length ?? 0,
          });
        },
      });

      let fullText = "";
      let productsAppended = false;
      let lastProducts: import("@/types/commerce").ProductCard[] = [];

      for await (const part of response.fullStream) {
        logger.debug("Stream part", { type: part.type });
        switch (part.type) {
          case "text-delta":
            fullText += part.textDelta;
            break;

          case "tool-call":
            if (part.toolName.toLowerCase().includes("product")) {
              uiStream.update(<ProductGridSkeleton />);
            }
            break;

          case "tool-result": {
            const { toolName, result } = (part as any).result ?? {};
            logger.debug("Tool result received", { toolName, hasResult: !!result });
            
            if (toolName?.toLowerCase().includes("product")) {
              const parsed = extractJsonFromToolContent((result as any)?.content) ?? result;
              const products = normalizeProducts(parsed);
              logger.info("Products normalized", { count: products.length, first: products[0] });
              if (products.length > 0) {
                lastProducts = products;
                uiStream.update(<ProductGrid title="Results" products={products} />);
                productsAppended = true;
              }
            }
            break;
          }

          case "error":
            return finishWithError((part as any).error);
        }
      }

      aiState.done([
        ...(aiState.get() as CoreMessage[]),
        { role: "assistant", content: fullText || "Done" },
      ]);

      // Final UI: preserve products if shown, add text if any
      if (productsAppended && fullText) {
        uiStream.done(
          <div className="flex flex-col gap-3">
            <ProductGrid title="Results" products={lastProducts} />
            <Message role="assistant" content={fullText} />
          </div>
        );
      } else if (productsAppended) {
        uiStream.done(<ProductGrid title="Results" products={lastProducts} />);
      } else if (fullText) {
        uiStream.done(<Message role="assistant" content={fullText} />);
      } else {
        uiStream.done();
      }

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
