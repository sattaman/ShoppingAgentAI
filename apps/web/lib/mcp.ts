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
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

async function getMcpClient(): Promise<McpClient> {
  if (global.__mcpClient) return global.__mcpClient;
  
  if (!global.__mcpClientPromise) {
    global.__mcpClientPromise = (async () => {
      const url = new URL(requireEnv("MCP_URL"));
      logger.info("Connecting to MCP", { url: url.toString() });
      
      const client = new Client(
        { name: "shopping-agent", version: "0.1.0" },
        { capabilities: {} },
      );
      const transport = new StreamableHTTPClientTransport(url);
      await client.connect(transport);
      
      logger.info("MCP connected");
      return client;
    })();
  }

  global.__mcpClient = await global.__mcpClientPromise;
  return global.__mcpClient;
}

let cachedTools: Awaited<ReturnType<typeof listMcpTools>> | null = null;

export async function getMcpTools() {
  if (!cachedTools) {
    try {
      cachedTools = await listMcpTools();
    } catch (err) {
      logger.error("Failed to list MCP tools", err);
      return { tools: [] };
    }
  }
  return cachedTools;
}

export async function listMcpTools() {
  const client = await getMcpClient();
  return client.listTools({});
}

export async function callMcpTool(toolName: string, args?: Record<string, unknown>) {
  const client = await getMcpClient();
  return client.callTool({
    name: toolName,
    arguments: args ?? {},
  });
}
