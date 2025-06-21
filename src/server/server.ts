#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

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

const server = new Server(
  {
    name: "secure-filesystem-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ ...tools }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params

    switch (name) {
      case "read_file": { return readFile(args) }
      case "read_multiple_files": { return readMultipleFiles(args) }
      case "write_file": { return writeFile(args) }
      case "edit_file": { return editFile(args) }
      case "create_directory": { return createDirectory(args) }
      case "list_directory": { return listDirectory(args) }
      case "directory_tree": { return directoryTree(args) }
      case "move_file": { return moveFile(args) }
      case "search_files": { return searchFile(args) }
      case "get_file_info": { return fileInformation(args) }

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

// Start server
async function runServer() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("Secure MCP Filesystem Server running on stdio")
  console.error("Allowed directories:", allowedDirectories)
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error)
  process.exit(1)
})
