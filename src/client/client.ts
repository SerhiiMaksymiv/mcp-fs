import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

export interface MCPClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getProjectStructure(): Promise<any>;
  readFile(filePath: string): Promise<any>;
}

export class MCPCodeClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor() {
    this.transport = new StdioClientTransport({
      command: "node",
      args: ["dist/src/server/server.js", "./dist/"]
    });

    this.client = new Client({
      name: 'code-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
  }

  async connect() {
    await this.client.connect(this.transport);
    console.log('Connected to MCP Code Server');
  }

  async disconnect() {
    await this.client.close();
  }

  async getProjectStructure(path?: string) {
    try {
      const result = await this.client.request(
        { method: 'tools/call', params: { name: 'list_directory', arguments: { path } } },
        CallToolResultSchema
      );
      return result.content;
    } catch (error) {
      console.error('Error getting project structure:', error);
      throw error;
    }
  }

  async readFile(path: string) {
    try {
      const result = await this.client.request(
        { method: 'tools/call', params: { name: 'read_file', arguments: { path } } },
        CallToolResultSchema
      );
      return result.content
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }
}
