import { Message, TextStreamMessage } from "@/components/chat";
import { google } from "@ai-sdk/google";
import { CoreMessage, generateId, streamText, tool } from "ai";
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
} from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";
import { callMcpTool, listMcpTools } from "@/lib/mcp";
import {
  extractJsonFromToolContent,
  normalizeCart,
  normalizeProducts,
} from "@/lib/commerce";
import { ProductGrid, CartView } from "@/components/commerce";

const toolListPromise = (() => {
  let cached: Awaited<ReturnType<typeof listMcpTools>> | null = null;
  return async () => {
    if (!cached) {
      try {
        cached = await listMcpTools();
      } catch {
        return { tools: [] };
      }
    }
    return cached;
  };
})();

function getAllowedToolNames() {
  const raw = process.env.MCP_TOOL_ALLOWLIST;
  if (!raw) return null;
  const list = raw.split(",").map((e) => e.trim()).filter(Boolean);
  return list.length ? new Set(list) : null;
}

function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  const type = schema.type as string;
  const desc = schema.description as string | undefined;
  const items = schema.items as Record<string, unknown> | undefined;

  let zodType: z.ZodTypeAny;
  switch (type) {
    case "string":
      zodType = z.string();
      break;
    case "integer":
      zodType = z.number().int();
      break;
    case "number":
      zodType = z.number();
      break;
    case "boolean":
      zodType = z.boolean();
      break;
    case "array": {
      const itemType = items?.type as string | undefined;
      zodType = itemType === "integer"
        ? z.array(z.number().int())
        : itemType === "number"
          ? z.array(z.number())
          : z.array(z.string());
      break;
    }
    default:
      zodType = z.string();
  }
  return desc ? zodType.describe(desc) : zodType;
}

const sendMessage = async (message: string) => {
  "use server";

  const messages = getMutableAIState<typeof AI>("messages");
  const allowedToolNames = getAllowedToolNames();
  const toolList = await toolListPromise();

  // Build tools for streamText (with execute instead of generate)
  const tools: Record<string, any> = {};
  for (const mcpTool of toolList.tools) {
    if (allowedToolNames && !allowedToolNames.has(mcpTool.name)) continue;

    const inputSchema = mcpTool.inputSchema as { properties?: Record<string, Record<string, unknown>>; required?: string[] } | undefined;
    const properties = inputSchema?.properties ?? {};
    const required = new Set(inputSchema?.required ?? []);

    const zodShape: Record<string, z.ZodTypeAny> = {};
    for (const [key, propSchema] of Object.entries(properties)) {
      const field = jsonSchemaToZod(propSchema);
      zodShape[key] = required.has(key) ? field : field.optional();
    }

    tools[mcpTool.name] = tool({
      description: mcpTool.description ?? "MCP tool",
      parameters: z.object(zodShape).strict(),
      execute: async (args) => {
        const result = await callMcpTool(mcpTool.name, args);
        return { toolName: mcpTool.name, result };
      },
    });
  }

  messages.update([
    ...(messages.get() as CoreMessage[]).filter(m => !(m.role === "assistant" && !m.content)),
    { role: "user", content: message },
  ]);

  const uiStream = createStreamableUI();
  const textStream = createStreamableValue("");

  // Start with text streaming component
  uiStream.update(<TextStreamMessage content={textStream.value} />);

  const modelName = process.env.GOOGLE_MODEL ?? "gemini-2.5-flash";

  (async () => {
    const result = streamText({
      model: google(modelName),
      system: `You are an AI shopping assistant connected to a commercetools backend.
Rules:
- Use the available tools to search products, manage carts, and create orders.
- Never invent products, prices, or availability.
- Keep replies concise and action oriented.`,
      messages: messages.get() as CoreMessage[],
      tools,
      maxSteps: 5,
    });

    let fullText = "";

    for await (const part of (await result).fullStream) {
      if (part.type === "text-delta") {
        fullText += part.textDelta;
        textStream.update(fullText);
      } else if (part.type === "tool-result") {
        const { toolName, result: toolResult } = part.result as { toolName: string; result: unknown };
        const parsed = extractJsonFromToolContent((toolResult as any)?.content) ?? toolResult;

        let content: ReactNode;
        if (toolName.toLowerCase().includes("product")) {
          const products = normalizeProducts(parsed);
          if (products.length > 0) {
            content = <ProductGrid title="Search results" products={products} />;
          }
        } else if (toolName.toLowerCase().includes("cart")) {
          const cart = normalizeCart(parsed);
          content = cart ? <CartView cart={cart} /> : <Message role="assistant" content="Cart updated" />;
        } else {
          content = <Message role="assistant" content={JSON.stringify(parsed, null, 2).slice(0, 500)} />;
        }

        if (content) {
          uiStream.append(content);
        }
      }
    }

    textStream.done();
    
    await result;
    messages.done([
      ...(messages.get() as CoreMessage[]),
      { role: "assistant", content: fullText || "Done" },
    ]);

    if (!fullText) {
      // If no text was generated, close the text component
      uiStream.update(<></>);
    }
    
    uiStream.done();
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
