import { LLMCodeAnalyzer } from './analyzer.js';
import { LLMProvider } from '../types.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export class InteractiveCLI {
  private analyzer: LLMCodeAnalyzer;

  constructor(llmProvider: LLMProvider) {
    this.analyzer = new LLMCodeAnalyzer(llmProvider);
  }

  async start() {
    console.log('🚀 Starting Local LLM Code Analyzer...');
    await this.analyzer.initialize();
    
    console.log('\n📝 Available commands:');
    console.log('  - ask <question>: Ask any question about your code');
    console.log('  - read file: Read a file and analyze its content');
    console.log('  - struct: Get the project structure');
    console.log('  - similar <description>: Find similar code patterns');
    console.log('  - exit: Quit the analyzer\n');

    const rl = readline.createInterface({ input, output });

    const askQuestion = async () => {
      try {
        const answer = await rl.question('What would you like to know about your code?\n\t> ');
        const [command, ...args] = answer.trim().split(' ');
          
        try {
          let response = '';
          
          switch (command.toLowerCase()) {

            case 'ask':
              response = await this.analyzer.askQuestion(args.join(' '));
              break;

            case 'similar':
              response = await this.analyzer.findSimilarCode(args.join(' '));
              break;

            case 'struct':
              response = await this.analyzer.getStructure();
              break;

            case 'tree':
              response = await this.analyzer.getTree(args.join(' '));
              break;

            case 'read':
              response = await this.analyzer.readFile(args.join(' '));
              break;

            case 'exit':
              console.log('👋 Goodbye!');
              await this.analyzer.close();
              process.exit(0)

            default:
              console.log('👋 Goodbye!');
              await this.analyzer.close();
              process.exit(0)
          }
          
          console.log('\n' + '='.repeat(80));
          console.log(response);
          console.log('='.repeat(80) + '\n');
            
          } catch (error: any) {
            console.error('❌ Error:', error.message);
          }

          await askQuestion();
          
      } catch(err) {
        console.log(`Error: `, err);
      } finally {
        rl.close();
      }
    }

    await askQuestion();
  }
}

