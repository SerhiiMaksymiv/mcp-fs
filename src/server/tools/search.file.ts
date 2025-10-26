import { SearchFilesArgsSchema } from "../schemas.js"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"
import { searchFiles } from "../files.js"

export async function searchFile(args: any): Promise<ContentResponse> {
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
