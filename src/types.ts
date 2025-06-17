import { z } from "zod";
import { ToolInputSchema } from "./server/schemas.js";

export interface LLMProvider {
  generateResponse(prompt: string, context?: any): Promise<string>;
}

export type ToolInput = z.infer<typeof ToolInputSchema>;

export interface FileInfo {
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  isDirectory: boolean;
  isFile: boolean;
  permissions: string;
}

export type Content = {
  type: "text" | "image" | "audio" | "video" | "file" | "directory" | "other";
  text?: string;
  image?: string;
  audio?: string;
  video?: string;
  file?: string;
  directory?: string;
  other?: string;
}

export type ContentResponse = {
  content: Array<{ type: string; text: string }>
  isError?: boolean
}
