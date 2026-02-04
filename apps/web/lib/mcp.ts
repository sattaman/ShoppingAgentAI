import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type McpClient = Client;

declare global {
  // eslint-disable-next-line no-var
  var __mcpClient: McpClient | undefined;
  // eslint-disable-next-line no-var
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
      const client = new Client(
        { name: "ct-poc-ui", version: "0.1.0" },
        { capabilities: {} },
      );
      const transport = new StreamableHTTPClientTransport(url);
      await client.connect(transport);
      return client;
    })();
  }

  global.__mcpClient = await global.__mcpClientPromise;
  return global.__mcpClient;
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
