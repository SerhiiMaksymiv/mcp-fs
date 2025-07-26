import { InteractiveCLI } from './llm/cli.js'
import { OllamaProvider } from './llm/ollama.js'

async function main() {
  const provider = new OllamaProvider()
  const cli = new InteractiveCLI(provider)
  await cli.start()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}
