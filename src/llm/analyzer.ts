import { MCPCodeClient } from '../client/client.js';
import { LLMProvider } from '../types.js';

export class LLMCodeAnalyzer {
  private mcpClient: MCPCodeClient;
  private llmProvider: LLMProvider;
  // private contextCache: Map<string, any> = new Map();

  constructor(llmProvider: LLMProvider) {
    this.mcpClient = new MCPCodeClient();
    this.llmProvider = llmProvider;
  }

  async initialize() {
    await this.mcpClient.connect();
  }

  async askQuestion(question: string, useContext = true): Promise<string> {
    try {
      let context = null;
      
      if (useContext) {
        context = await this.gatherRelevantContext(question);
      }

      const response = await this.llmProvider.generateResponse(question, context);
      return response;
    } catch (error) {
      console.error('Error processing question:', error);
      throw error;
    }
  }

  private async gatherRelevantContext(question: string): Promise<any> {
    const lowerQuestion = question.toLowerCase();
    const context: any = {};

    if (lowerQuestion.includes('struct') || lowerQuestion.includes('organization') || lowerQuestion.includes('directory')) {
      const structure = await this.mcpClient.getProjectStructure();
      context.projectStructure = structure;
    }

    return context;
  }

  async findSimilarCode(description: string): Promise<string> {
    const context = {
      structure: await this.mcpClient.getProjectStructure()
    };

    const prompt = `
      Based on this description: "${description}",
      find similar code patterns or functions in the project and explain how they work.
    `;
    
    return await this.llmProvider.generateResponse(prompt, context);
  }

  async readFile(filePath: string): Promise<string> {
    const context = {
      file: await this.mcpClient.readFile(filePath)
    };
    const prompt = `
      Analyze the file content.
      Look at file sizes,
      number of functions,
      project structure, code style,
      any errors and provide recommendations for improvement,
      based on the file content.
    `;
    
    return await this.llmProvider.generateResponse(prompt, context);
  }

  async getTree(path: string): Promise<string> {
    const context = {
      tree: await this.mcpClient.getTree(path)
    }

    const prompt = `Get the directory structure of the project`;
    return this.llmProvider.generateResponse(prompt, context);
  }

  async findFunctions(path: string, ctx: string): Promise<string> {
    const context = {
      functions: await this.mcpClient.findFunctions(path, ctx)
    }
    const prompt = `
      Find functions in the project that match described context: ${ctx}
    `;
    return this.llmProvider.generateResponse(prompt, context);
  }

  async getStructure(): Promise<string> {
    const context = {
      structure: await this.mcpClient.getProjectStructure()
    }

    const prompt = `
      Analyze the project structure.
      Look at file sizes, number of functions,
      and just report the project structure.
    `;
    
    return this.llmProvider.generateResponse(prompt, context);
  }

  async close() {
    await this.mcpClient.disconnect();
  }
}

