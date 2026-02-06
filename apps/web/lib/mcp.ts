import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { logger } from "./logger";

const MCP_URL = process.env.MCP_URL || "http://localhost:8888/mcp";

let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (client) return client;

  client = new Client(
    { name: "shopping-agent", version: "0.1.0" },
    { capabilities: {} }
  );

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  await client.connect(transport);
  logger.info("MCP connected via HTTP", { url: MCP_URL });

  return client;
}

let cachedTools: Awaited<ReturnType<Client["listTools"]>> | null = null;

export async function getMcpTools() {
  if (!cachedTools) {
    try {
      const c = await getClient();
      cachedTools = await c.listTools({});
    } catch (err) {
      logger.error("Failed to list MCP tools", err);
      return { tools: [] };
    }
  }
  return cachedTools;
}

export async function callMcpTool(toolName: string, args?: Record<string, unknown>) {
  try {
    const c = await getClient();
    return c.callTool({ name: toolName, arguments: args ?? {} });
  } catch (err) {
    client = null;
    cachedTools = null;
    throw err;
  }
}
