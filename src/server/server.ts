import { Server, ServerOptions } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, Implementation } from "@modelcontextprotocol/sdk/types.js"

import { SearchFilesArgsSchema, ReadFileArgsSchema } from "./schemas.js"
import { validatePath } from "./paths.js"
import { ContentResponse, FileInfo } from "../types.js"
import { searchFiles as search, isSupportedFile } from "./files.js"

import fs from "node:fs/promises";
import path from "node:path";

import { readFile } from "./tools/read.file.js"
import { readMultipleFiles } from "./tools/read.multiple.files.js"
import { writeFile } from "./tools/write.file.js"
import { editFile } from "./tools/edit.file.js"
import { createDirectory } from "./tools/create.directory.js"
import { listDirectory } from "./tools/list.directory.js"
import { directoryTree } from "./tools/directory.tree.js"
import { moveFile } from "./tools/move.file.js"
import { fileInformation } from "./tools/file.information.js"
import { allowedDirectories } from "./paths.js"
import { tools } from "./tools.js"
import { findFunctions } from "./tools/find.functions.js"

class McpServer {
  private server: Server

  constructor(
    _serverInfo: Implementation = { name: "secure-filesystem-server", version: "0.2.0" },
    options: ServerOptions = { capabilities: { tools: tools, logging: {} } }
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
          case "search_files": { return this.searchFiles(args) }
          case "get_file_info": { return fileInformation(args) }
          case "tree": { return directoryTree(args) }
          case "find_functions": { return findFunctions(args) }

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

  private async searchFiles(args: any): Promise<ContentResponse> {
    const parsed = SearchFilesArgsSchema.safeParse(args)
    if (!parsed.success) {
      throw new Error(`Invalid arguments for search_files: ${parsed.error}`)
    }
    const validPath = await validatePath(parsed.data.path)
    const results = await search(validPath, parsed.data.pattern, parsed.data.excludePatterns)
    return {
      content: [{ type: "text", text: results.length > 0 ? results.join("\n") : "No matches found" }],
    }
  }
  
  // @ts-ignore
  private async getProjectFiles(dirPath: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.name.startsWith('.') && item.name !== '.env') continue;
        
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          // Skip node_modules and other large directories
          if (['node_modules', 'dist', 'build', '.git'].includes(item.name)) continue;
          files.push(...await this.getProjectFiles(fullPath));
        } else if (isSupportedFile(item.name)) {
          const stats = await fs.stat(fullPath);
          files.push({
            path: fullPath,
            name: item.name,
            size: stats.size,
            modified: stats.mtime,
            type: path.extname(item.name)
          });
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
    
    return files;
  }

  // @ts-ignore
  private async readFile(args: any): Promise<ContentResponse> {
    const parsed = ReadFileArgsSchema.safeParse(args)
    if (!parsed.success) {
      throw new Error(`Invalid arguments for read_file: ${parsed.error}`)
    }

    const validPath = await validatePath(parsed.data.path)
    const content = await fs.readFile(validPath, "utf-8")
    return {
      content: [{ type: "text", text: content }],
    }
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
