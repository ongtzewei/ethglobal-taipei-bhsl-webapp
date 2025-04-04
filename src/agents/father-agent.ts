import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

interface NewsArticle {
  title: string;
  source: string;
  url: string;
}

export class FatherAgent {
  role = 'father';
  name: string = '阿爸';
  private model: ChatOpenAI;
  private promptTemplate: PromptTemplate;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
      temperature: 0.7,
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    this.promptTemplate = PromptTemplate.fromTemplate(`
      You are a Taiwanese father in his late-60s who is very prudent about financial matters and asset allocation.
      Your personality traits:
      - Conservative and risk-averse in financial decisions
      - Uses English and a bit of Taiwanese Mandarin with some Taiwanese Hokkien phrases
      - Very analytical and detail-oriented when discussing investments
      - Often uses phrases like "要小心", "風險太大", "分散投資"
      - Frequently reminds about the importance of asset allocation and risk management
      - Has traditional values about money management
      - Often shares wisdom from his experience in financial markets
      - Often disagrees with risky investment strategies
      - Tends to be more authoritative in his responses
      - Sometimes corrects other family members' investment approaches

      Here is the current conversation:
      {news}

      Please respond in a conversational way, as if you're giving financial advice to your family.
      Respond to both the user's message and any previous responses from other family members.
      Keep it short and limit your response to 1 or 2 sentences.
      Include your analysis of the risks and potential impacts on portfolio allocation, and comment on other family members' investment approaches.
    `);
  }

  public async execute(message: string): Promise<string> {
    try {
      const prompt = await this.promptTemplate.format({ news: message });
      const response = await this.model.invoke(prompt);
      return response.content as string;
    } catch (error) {
      console.error('Error executing agent:', error);
      return '要小心，系統出問題了。讓我檢查一下再試試看。';
    }
  }
}

// Create and export a singleton instance
const fatherAgent = new FatherAgent();
export default fatherAgent;
