import { ContentResponse } from "../../types.js"
import { getProjectFiles } from "../files.js"
import fs from "node:fs/promises"

export async function findFunctions(args: any): Promise<ContentResponse> {
  const { path } = args;
  if (!path) throw new Error('Path is required');
  const files = await getProjectFiles(path);
  const jsFiles = files.filter(f => ['.js', '.ts', '.jsx', '.tsx'].includes(f?.type ?? ''));
  const functions = [];
  
  for (const file of jsFiles) {
    try {
      if (!file.path) continue
      const content = await fs.readFile(file.path, 'utf-8');
      const functionRegex = /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|(?:async\s+)?(\w+)\s*\([^)]*\)\s*{)/g;
      
      let match;
      while ((match = functionRegex.exec(content)) !== null) {
        const functionName = match[1] || match[2] || match[3];
        if (functionName) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          functions.push({
            name: functionName,
            file: file.path,
            line: lineNumber
          });
        }
      }
    } catch (error) {
      console.error(`Error parsing ${file.path}:`, error);
    }
  }
  
  return {
    content: [
      { type: "text", text: functions.join(`\n`), content: functions },
    ]
  }
}
