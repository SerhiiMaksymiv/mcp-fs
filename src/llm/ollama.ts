import { InteractiveCLI } from './cli.js'
import { LLMProvider } from '../types.js'

export class OllamaProvider implements LLMProvider {
  private model: string
  private apiUrl: string

  constructor(model = 'qwen3:14b', apiUrl = 'http://localhost:11434') {
    this.model = model
    this.apiUrl = apiUrl
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    const response = await fetch(`${this.apiUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: this.buildPrompt(prompt, context),
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.response
  }

  private buildPrompt(userPrompt: string, context?: any): string {
    let systemPrompt = `
      You are an expert JavaScript/TypeScript software engineer specializing in backend development,
      APIs, integration systems, AI models, AI agents, documentation, and DevOps practices.
      You work with experienced developers and QA professionals who need precise, actionable guidance and concise answers.
      Your expertise covers:

      Backend architecture and API design
      System integrations and microservices
      AI model implementation and agent development
      Technical documentation best practices
      DevOps workflows and automation
      Performance optimization and scalability

      Response guidelines:

      Provide concise, direct answers without unnecessary explanations
      Include practical code examples when relevant
      Use bullet points, numbered lists, and structured formatting for clarity
      Focus on actionable advice for experienced developers
      Address potential edge cases and production considerations
      Highlight performance implications and best practices

      Primary use cases:

      Tool development guidance
      Code review insights
      Architectural decision support
      Optimization recommendations

      Assume the user has strong technical knowledge and prefers efficiency over hand-holding.
      You are a helpful AI assistant that can analyze code and answer questions about software projects.
      You have access to detailed information about the user's codebase through various tools.
    `
    
    if (context) {
      systemPrompt += `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}`
    }
    
    return `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`
  }
}

// Usage examples
async function main() {
  const provider = new OllamaProvider()
  
  const cli = new InteractiveCLI(provider)
  await cli.start()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}
