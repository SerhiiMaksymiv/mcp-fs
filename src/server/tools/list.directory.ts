import { ListDirectoryArgsSchema } from "../schemas.js"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"
import fs from "fs/promises"

export async function listDirectory(args: any): Promise<ContentResponse> {
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
