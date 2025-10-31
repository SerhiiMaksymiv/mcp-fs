import { Server, ServerOptions } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, Implementation } from "@modelcontextprotocol/sdk/types.js"

import { readFile } from "./tools/read.file.js"
import { readMultipleFiles } from "./tools/read.multiple.files.js"
import { writeFile } from "./tools/write.file.js"
import { editFile } from "./tools/edit.file.js"
import { createDirectory } from "./tools/create.directory.js"
import { listDirectory } from "./tools/list.directory.js"
import { directoryTree } from "./tools/directory.tree.js"
import { moveFile } from "./tools/move.file.js"
import { searchFile } from "./tools/search.file.js"
import { fileInformation } from "./tools/file.information.js"
import { allowedDirectories } from "./paths.js"
import { tools } from "./tools.js"

class McpServer {
  private server: Server

  constructor(
    _serverInfo: Implementation = { name: "secure-filesystem-server", version: "0.2.0" },
    options: ServerOptions = { capabilities: { tools: tools } }
  ) {

    this.server = new Server(_serverInfo, { ...options })

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params

        switch (name) {
          case "read_file": { return readFile(args) }
          case "read_multiple_files": { return readMultipleFiles(args) }
          case "write_file": { return writeFile(args) }
          case "edit_file": { return editFile(args) }
          case "create_directory": { return createDirectory(args) }
          case "list_directory": { return listDirectory(args) }
          case "move_file": { return moveFile(args) }
          case "search_files": { return searchFile(args) }
          case "get_file_info": { return fileInformation(args) }
          case "tree": { return directoryTree(args) }

          case "list_allowed_directories": {
            return {
              content: [{
                type: "text",
                text: `Allowed directories:\n${allowedDirectories.join('\n')}`
              }],
            }
          }

          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
          isError: true,
        }
      }
    })
  }

  // import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
  // connect method can be extended to support different transports, by passing a transport interface 
  async connect() {
    try {
      await this.server.connect(new StdioServerTransport())
      console.log("Secure MCP Filesystem Server running on stdio")
      console.log("Allowed directories:", allowedDirectories)
    } catch (error) {
      console.error("More fine-grained error connecting to server:", error)
      process.exit(1)
    }
  }
}

async function main() {
  new McpServer().connect()
}

main().catch((error) => {
  console.error("Error running server:", error)
  process.exit(1)
})

export { McpServer }
