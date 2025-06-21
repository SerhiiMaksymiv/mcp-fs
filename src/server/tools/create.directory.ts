import { CreateDirectoryArgsSchema } from "../schemas.js"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"
import fs from "fs/promises"

export async function createDirectory(args: any): Promise<ContentResponse> {
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
