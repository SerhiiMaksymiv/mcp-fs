import { ReadFileArgsSchema } from "../schemas.js"
import fs from "node:fs/promises"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"

export async function readFile(args: any): Promise<ContentResponse> {
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
