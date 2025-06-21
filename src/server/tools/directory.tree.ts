import path from "node:path"
import { DirectoryTreeArgsSchema } from "../schemas.js"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"
import fs from "fs/promises"

export async function directoryTree(args: any): Promise<ContentResponse> {
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
