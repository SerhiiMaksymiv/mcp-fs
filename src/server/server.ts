#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import fs from "fs/promises"
import path from "path"
import { readFile } from "./tools/read.file.js"
import {
  ReadMultipleFilesArgsSchema,
  WriteFileArgsSchema,
  EditFileArgsSchema,
  CreateDirectoryArgsSchema,
  ListDirectoryArgsSchema,
  DirectoryTreeArgsSchema,
  MoveFileArgsSchema,
  SearchFilesArgsSchema,
  GetFileInfoArgsSchema,
} from "./schemas.js"
import { getFileStats, searchFiles, applyFileEdits } from "./files.js"
import { allowedDirectories, validatePath } from "./paths.js"
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

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { ...tools }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params

    switch (name) {
      case "read_file": {
        return readFile(args)
      }

      case "read_multiple_files": {
        const parsed = ReadMultipleFilesArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for read_multiple_files: ${parsed.error}`)
        }
        const results = await Promise.all(
          parsed.data.paths.map(async (filePath: string) => {
            try {
              const validPath = await validatePath(filePath)
              const content = await fs.readFile(validPath, "utf-8")
              return `${filePath}:\n${content}\n`
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error)
              return `${filePath}: Error - ${errorMessage}`
            }
          }),
        )
        return {
          content: [{ type: "text", text: results.join("\n---\n") }],
        }
      }

      case "write_file": {
        const parsed = WriteFileArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for write_file: ${parsed.error}`)
        }
        const validPath = await validatePath(parsed.data.path)
        await fs.writeFile(validPath, parsed.data.content, "utf-8")
        return {
          content: [{ type: "text", text: `Successfully wrote to ${parsed.data.path}` }],
        }
      }

      case "edit_file": {
        const parsed = EditFileArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for edit_file: ${parsed.error}`)
        }
        const validPath = await validatePath(parsed.data.path)
        const result = await applyFileEdits(validPath, parsed.data.edits, parsed.data.dryRun)
        return {
          content: [{ type: "text", text: result }],
        }
      }

      case "create_directory": {
        const parsed = CreateDirectoryArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for create_directory: ${parsed.error}`)
        }
        const validPath = await validatePath(parsed.data.path)
        await fs.mkdir(validPath, { recursive: true })
        return {
          content: [{ type: "text", text: `Successfully created directory ${parsed.data.path}` }],
        }
      }

      case "list_directory": {
        const parsed = ListDirectoryArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for list_directory: ${parsed.error}`)
        }
        const validPath = await validatePath(parsed.data.path)
        const entries = await fs.readdir(validPath, { withFileTypes: true })
        const formatted = entries
          .map((entry) => `${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${entry.name}`)
          .join("\n")
        return {
          content: [{ type: "text", text: formatted }],
        }
      }

      case "directory_tree": {
        const parsed = DirectoryTreeArgsSchema.safeParse(args)
        if (!parsed.success) {
            throw new Error(`Invalid arguments for directory_tree: ${parsed.error}`)
        }

        interface TreeEntry {
            name: string
            type: 'file' | 'directory'
            children?: TreeEntry[]
        }

        async function buildTree(currentPath: string): Promise<TreeEntry[]> {
          const validPath = await validatePath(currentPath)
          const entries = await fs.readdir(validPath, {withFileTypes: true})
          const result: TreeEntry[] = []

          for (const entry of entries) {
            const entryData: TreeEntry = {
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file'
            }

            if (entry.isDirectory()) {
                const subPath = path.join(currentPath, entry.name)
                entryData.children = await buildTree(subPath)
            }

            result.push(entryData)
          }

          return result
        }

        const treeData = await buildTree(parsed.data.path)
        return {
            content: [{
                type: "text",
                text: JSON.stringify(treeData, null, 2)
            }],
        }
      }

      case "move_file": {
        const parsed = MoveFileArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for move_file: ${parsed.error}`)
        }
        const validSourcePath = await validatePath(parsed.data.source)
        const validDestPath = await validatePath(parsed.data.destination)
        await fs.rename(validSourcePath, validDestPath)
        return {
          content: [{ type: "text", text: `Successfully moved ${parsed.data.source} to ${parsed.data.destination}` }],
        }
      }

      case "search_files": {
        const parsed = SearchFilesArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for search_files: ${parsed.error}`)
        }
        const validPath = await validatePath(parsed.data.path)
        const results = await searchFiles(validPath, parsed.data.pattern, parsed.data.excludePatterns)
        return {
          content: [{ type: "text", text: results.length > 0 ? results.join("\n") : "No matches found" }],
        }
      }

      case "get_file_info": {
        const parsed = GetFileInfoArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for get_file_info: ${parsed.error}`)
        }
        const validPath = await validatePath(parsed.data.path)
        const info = await getFileStats(validPath)
        return {
          content: [{ type: "text", text: Object.entries(info)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n") }],
        }
      }

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
