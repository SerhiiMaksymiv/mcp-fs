import { GetFileInfoArgsSchema } from "../schemas.js"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"
import { getFileStats } from "../files.js"

export async function fileInformation(args: any): Promise<ContentResponse> {
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
