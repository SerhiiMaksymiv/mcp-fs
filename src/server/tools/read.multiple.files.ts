import { ReadMultipleFilesArgsSchema } from "../schemas.js"
import fs from "node:fs/promises"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"

export async function readMultipleFiles(args: any): Promise<ContentResponse> {
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
