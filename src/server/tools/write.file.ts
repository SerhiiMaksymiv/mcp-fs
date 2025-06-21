import { WriteFileArgsSchema } from "../schemas.js"
import fs from "node:fs/promises"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"

export async function writeFile(args: any): Promise<ContentResponse> {

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
