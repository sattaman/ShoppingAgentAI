import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { logger } from "./logger";

type McpClient = Client;

declare global {
  var __mcpClient: McpClient | undefined;
  var __mcpClientPromise: Promise<McpClient> | undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function getMcpClient(): Promise<McpClient> {
  if (global.__mcpClient) return global.__mcpClient;
  if (!global.__mcpClientPromise) {
    global.__mcpClientPromise = (async () => {
      const url = new URL(requireEnv("MCP_URL"));
      logger.info("Connecting to MCP server", { url: url.toString() });
      const client = new Client(
        { name: "ct-poc-ui", version: "0.1.0" },
        { capabilities: {} },
      );
      const transport = new StreamableHTTPClientTransport(url);
      await client.connect(transport);
      logger.info("MCP client connected");
      return client;
    })();
  }

  global.__mcpClient = await global.__mcpClientPromise;
  return global.__mcpClient;
}

export async function listMcpTools() {
  const client = await getMcpClient();
  logger.debug("Listing MCP tools");
  const result = await client.listTools({});
  logger.debug("MCP tools listed", { count: result.tools.length });
  return result;
}

export async function callMcpTool(toolName: string, args?: Record<string, unknown>) {
  const client = await getMcpClient();
  logger.info("Calling MCP tool", { toolName, args });
  try {
    const result = await client.callTool({
      name: toolName,
      arguments: args ?? {},
    });
    logger.debug("MCP tool response", { toolName, result });
    return result;
  } catch (err) {
    logger.error("MCP tool call failed", { toolName, error: err });
    throw err;
  }
}

let cachedTools: Awaited<ReturnType<typeof listMcpTools>> | null = null;

export async function getMcpTools() {
  if (!cachedTools) {
    try {
      cachedTools = await listMcpTools();
    } catch {
      return { tools: [] };
    }
  }
  return cachedTools;
}
