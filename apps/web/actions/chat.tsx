"use server";

import { TextStreamMessage } from "@/components/chat";
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

  logger.info("sendMessage called", { message });

  const messages = getMutableAIState<typeof AI>("messages");
  
  let mcpTools;
  try {
    mcpTools = await getMcpTools();
    logger.debug("MCP tools loaded", { count: mcpTools.tools.length });
  } catch (err) {
    logger.error("Failed to load MCP tools", err);
    throw err;
  }

  const tools: Record<string, any> = {};
  for (const mcpTool of mcpTools.tools) {
    tools[mcpTool.name] = tool({
      description: mcpTool.description ?? "",
      parameters: buildZodSchema(mcpTool.inputSchema as any),
      execute: async (args) => {
        logger.info(`Calling MCP tool: ${mcpTool.name}`, args);
        try {
          const result = await callMcpTool(mcpTool.name, args);
          logger.debug(`MCP tool result: ${mcpTool.name}`, result);
          return { toolName: mcpTool.name, result };
        } catch (err) {
          logger.error(`MCP tool failed: ${mcpTool.name}`, err);
          throw err;
        }
      },
    });
  }

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  const uiStream = createStreamableUI();
  const textStream = createStreamableValue("");
  uiStream.update(<TextStreamMessage content={textStream.value} />);

  (async () => {
    try {
      logger.debug("Starting streamText");
      const result = streamText({
        model: google(process.env.GOOGLE_MODEL ?? "gemini-2.5-flash"),
        system: "You are an AI shopping assistant. Use tools to search products. Be concise.",
        messages: messages.get() as CoreMessage[],
        tools,
        maxSteps: 3,
      });

      let fullText = "";

      logger.debug("Awaiting result stream");
      const stream = await result;
      logger.debug("Got stream, iterating fullStream");
      
      for await (const part of stream.fullStream) {
        logger.debug("Stream part received", { type: part.type });
        if (part.type === "text-delta") {
          fullText += part.textDelta;
          textStream.update(fullText);
        } else if (part.type === "error") {
          logger.error("Stream error", part);
          const errorMsg = (part as any).error?.message || "An error occurred";
          if (errorMsg.includes("quota")) {
            uiStream.append(<div className="text-red-500 text-sm p-2">API rate limit reached. Please wait a moment and try again.</div>);
          } else {
            uiStream.append(<div className="text-red-500 text-sm p-2">Error: {errorMsg}</div>);
          }
        } else if (part.type === "tool-result") {
          const { toolName, result: toolResult } = part.result as { toolName: string; result: unknown };
          logger.debug("Processing tool result", { toolName });
          const parsed = extractJsonFromToolContent((toolResult as any)?.content) ?? toolResult;

          if (toolName.toLowerCase().includes("product")) {
            const products = normalizeProducts(parsed);
            logger.info("Products normalized", { count: products.length });
            if (products.length > 0) {
              uiStream.append(<ProductGrid title="Results" products={products} />);
            }
          }
        }
      }

      logger.debug("Stream complete", { fullTextLength: fullText.length });
      textStream.done();
      messages.done([
        ...(messages.get() as CoreMessage[]),
        { role: "assistant", content: fullText || "Done" },
      ]);
      if (!fullText) uiStream.update(<></>);
      uiStream.done();
    } catch (err) {
      logger.error("Stream processing failed", err);
      textStream.done();
      uiStream.done();
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
