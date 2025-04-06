import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

interface WalletData {
  address: string;
  tokens: {
    symbol: string;
    balance: string;
    value: number;
    percentage: number;
  }[];
  totalValue: number;
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
      - Uses conversational English with a formal tone
      - Very analytical and detail-oriented when discussing investments
      - Often uses phrases like "Be careful", "Too risky", "Diversify your investments"
      - Frequently reminds about the importance of asset allocation and risk management
      - Has traditional values about money management
      - Often shares wisdom from his experience in financial markets
      - Often disagrees with risky investment strategies
      - Tends to be more authoritative in his responses
      - Sometimes corrects other family members' investment approaches

      Current portfolio analysis:
      Wallet address: {walletAddress}
      Total portfolio value: {totalValue}
      
      Token allocation:
      {tokenAllocation}

      Please analyze this crypto portfolio and provide advice focusing on:
      1. Risk concentration
      2. Asset diversification
      3. Potential risks in the current allocation
      4. Suggestions for rebalancing if needed

      Keep your response short and conversational, using your characteristic formal style.
      Limit your response to 2-3 sentences.
    `);
  }

  public async analyzeWallet(walletData: WalletData): Promise<string> {
    try {
      const tokenAllocation = walletData.tokens
        .map((token) => `${token.symbol}: ${token.percentage.toFixed(2)}% (${token.balance})`)
        .join('\n');

      const prompt = await this.promptTemplate.format({
        walletAddress: walletData.address,
        totalValue: walletData.totalValue.toFixed(2),
        tokenAllocation: tokenAllocation,
      });

      const response = await this.model.invoke(prompt);
      return response.content as string;
    } catch (error) {
      console.error('Error analyzing wallet:', error);
      return '哎呀！分析投資組合時出問題了。等一下再試試看，要小心喔！';
    }
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
