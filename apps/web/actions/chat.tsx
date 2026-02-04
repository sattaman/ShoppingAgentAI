"use server";

import { TextStreamMessage, Message } from "@/components/chat";
import { ProductGrid } from "@/components/commerce";
import { google } from "@ai-sdk/google";
import { CoreMessage, generateId, streamText, tool } from "ai";
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
} from "ai/rsc";
import { ReactNode } from "react";
import { callMcpTool, getMcpTools } from "@/lib/mcp";
import { buildZodSchema } from "@/lib/schema";
import { extractJsonFromToolContent, normalizeProducts } from "@/lib/commerce";
import { logger } from "@/lib/logger";

const sendMessage = async (message: string) => {
  "use server";

  logger.info("Chat request", { message });

  const aiState = getMutableAIState<typeof AI>("messages");
  
  // Load MCP tools
  const mcpTools = await getMcpTools();
  logger.debug("Tools available", { count: mcpTools.tools.length });

  // Convert MCP tools to AI SDK format
  const tools: Record<string, any> = {};
  for (const mcpTool of mcpTools.tools) {
    tools[mcpTool.name] = tool({
      description: mcpTool.description ?? "",
      parameters: buildZodSchema(mcpTool.inputSchema as any),
      execute: async (args) => {
        logger.info("Tool call", { tool: mcpTool.name, args });
        const result = await callMcpTool(mcpTool.name, args);
        logger.debug("Tool response", { tool: mcpTool.name });
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
    logger.error("Chat failed", { error: message });
    
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
        system: "You are an AI shopping assistant. Use tools to search products. Be concise.",
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
