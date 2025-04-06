import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import CoinGecko from 'coingecko-api';

interface TradingData {
  symbol: string;
  currentPrice: number;
  supportLevels: number[];
  resistanceLevels: number[];
  volume: number;
  marketCap: number;
  priceHistory: {
    timestamp: number;
    price: number;
  }[];
}

export class BrotherAgent {
  role = 'brother';
  name: string = '毛弟';
  private model: ChatOpenAI;
  private promptTemplate: PromptTemplate;
  private coinGecko: CoinGecko;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
      temperature: 0.7,
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    this.coinGecko = new CoinGecko();

    this.promptTemplate = PromptTemplate.fromTemplate(`
      You are a Taiwanese brother in his mid-20s who is an active Web3 crypto trader.
      Your personality traits:
      - High-risk, high-reward trading mentality
      - Focuses primarily on Web3 and DeFi projects
      - Uses conversational English with some crypto slang
      - Very active on crypto social media and trading platforms
      - Often uses phrases like "Let's go!", "This looks good", "I'm all in"
      - Frequently mentions technical analysis and trading patterns
      - Talks about leverage and futures trading
      - Often shares trading positions and P&L
      - Uses emojis and internet slang in conversations
      - Sometimes mentions trading bots and automated strategies
      - Often talks about market sentiment and whale movements
      - Often disagrees with conservative investment approaches
      - Tends to be more enthusiastic and persuasive in his responses
      - Sometimes tries to convince others to take more risks
      - Often shares his latest trading successes

      Here are the current market conditions and price history for {symbol}:
      Current Price: {currentPrice}
      Market Cap: {marketCap}
      Volume: {volume}
      
      Price History (last 5 days):
      {priceHistory}

      Technical Analysis:
      - Support Levels: {supportLevels}
      - Resistance Levels: {resistanceLevels}

      User's question: {userMessage}

      Please provide:
      1. Technical analysis of the price movement over the last 5 days
      2. Potential entry points with support/resistance levels
      3. Risk management suggestions
      4. Your current trading positions or plans

      Respond in a conversational way, as if you're discussing trading with your older brother.
      Keep it short and limit your response to 2-3 sentences.
      Include specific price levels and trading strategies.
      Use emojis and internet slang to make it more engaging.
    `);
  }

  private async getMarketData(symbol: string): Promise<TradingData> {
    try {
      const response = await this.coinGecko.coins.fetchMarketChart('bitcoin', {
        vs_currency: 'usd',
        days: '30',
        interval: 'daily',
      });

      const priceHistory = response.data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
      }));

      const currentPrice = priceHistory[priceHistory.length - 1].price;
      const volume = response.data.total_volumes[response.data.total_volumes.length - 1][1];
      const marketCap = response.data.market_caps[response.data.market_caps.length - 1][1];

      // Calculate support and resistance levels based on price history
      const prices = priceHistory.map((p) => p.price);
      const supportLevels = this.calculateSupportLevels(prices);
      const resistanceLevels = this.calculateResistanceLevels(prices);

      return {
        symbol,
        currentPrice,
        supportLevels,
        resistanceLevels,
        volume,
        marketCap,
        priceHistory,
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }

  private calculateSupportLevels(prices: number[]): number[] {
    // Simple implementation - in a real scenario, you'd want more sophisticated analysis
    const minPrice = Math.min(...prices);
    const support1 = minPrice * 0.98;
    const support2 = minPrice * 0.95;
    return [support1, support2];
  }

  private calculateResistanceLevels(prices: number[]): number[] {
    // Simple implementation - in a real scenario, you'd want more sophisticated analysis
    const maxPrice = Math.max(...prices);
    const resistance1 = maxPrice * 1.02;
    const resistance2 = maxPrice * 1.05;
    return [resistance1, resistance2];
  }

  public async execute(message: string): Promise<string> {
    try {
      const marketData = await this.getMarketData('BTC');

      const priceHistoryText = marketData.priceHistory
        .map(
          (p: { timestamp: number; price: number }) =>
            `${new Date(p.timestamp).toLocaleDateString()}: $${p.price.toFixed(2)}`,
        )
        .join('\n');

      const prompt = await this.promptTemplate.format({
        symbol: marketData.symbol,
        currentPrice: marketData.currentPrice.toFixed(2),
        marketCap: marketData.marketCap.toLocaleString(),
        volume: marketData.volume.toLocaleString(),
        priceHistory: priceHistoryText,
        supportLevels: marketData.supportLevels.map((l) => l.toFixed(2)).join(', '),
        resistanceLevels: marketData.resistanceLevels.map((l) => l.toFixed(2)).join(', '),
        userMessage: message,
      });

      const response = await this.model.invoke(prompt);
      return response.content as string;
    } catch (error) {
      console.error('Error executing agent:', error);
      return '靠北，系統掛了！等我一下，馬上修好！';
    }
  }
}

// Create and export a singleton instance
const brotherAgent = new BrotherAgent();
export default brotherAgent;
