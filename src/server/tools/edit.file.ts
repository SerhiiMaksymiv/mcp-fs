import { EditFileArgsSchema } from "../schemas.js"
import { validatePath } from "../paths.js"
import { ContentResponse } from "../../types.js"
import { applyFileEdits } from "../files.js"

export async function editFile(args: any): Promise<ContentResponse> {
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
