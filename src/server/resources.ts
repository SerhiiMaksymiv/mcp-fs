import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

export const resources = {
  resources: [
    {
      name: 'echo',
      description: 'Echoes back messages as resources',
      template: new ResourceTemplate('echo://{message}', { list: undefined }),
    }
  ]
}
