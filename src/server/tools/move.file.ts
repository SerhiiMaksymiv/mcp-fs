import { MoveFileArgsSchema } from "../schemas.js"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"
import fs from "fs/promises"

export async function moveFile(args: any): Promise<ContentResponse> {
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
