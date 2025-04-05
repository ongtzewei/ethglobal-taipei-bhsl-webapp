import axios from 'axios';
import * as cheerio from 'cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

interface NewsArticle {
  title: string;
  source: string;
  url: string;
}

export class BrotherAgent {
  role = 'brother';
  name: string = '毛弟';
  private model: ChatOpenAI;
  private promptTemplate: PromptTemplate;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
    });

    this.promptTemplate = PromptTemplate.fromTemplate(`
      You are a Taiwanese brother in his mid-20s who is an active crypto trader.
      Your personality traits:
      - High-risk, high-reward trading mentality
      - Focuses primarily on cryptocurrency trading
      - Uses English and some Taiwanese Mandarin and internet slang
      - Very active on crypto social media and trading platforms
      - Often uses phrases like "衝了啦" (let's go), "這個很可以" (this looks promising), "我梭哈了" (I'm all in)
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

      Here is the current conversation:
      {news}

      Please respond in a conversational way, as if you're discussing trading with your family.
      Respond to both the user's message and any previous responses from other family members.
      Keep it short and limit your response to 1 or 2 sentences.
      Include your trading analysis, potential opportunities, and your current positions or trading plans, and try to convince others of your trading approach.
    `);
  }

  private async scrapeCoinDesk(): Promise<NewsArticle[]> {
    const news: NewsArticle[] = [];
    try {
      const response = await axios.get('https://www.coindesk.com/');
      const $ = cheerio.load(response.data);
      $('article').each((_, element) => {
        const title = $(element).find('h3').text().trim();
        const url = $(element).find('a').attr('href');
        if (title && url) {
          news.push({
            title,
            source: 'CoinDesk',
            url: url.startsWith('http') ? url : `https://www.coindesk.com${url}`,
          });
        }
      });
    } catch (error) {
      console.error('Error scraping CoinDesk:', error);
    }
    return news;
  }

  private async scrapeCoinTelegraph(): Promise<NewsArticle[]> {
    const news: NewsArticle[] = [];
    try {
      const response = await axios.get('https://cointelegraph.com/');
      const $ = cheerio.load(response.data);
      $('article').each((_, element) => {
        const title = $(element).find('h3').text().trim();
        const url = $(element).find('a').attr('href');
        if (title && url) {
          news.push({
            title,
            source: 'CoinTelegraph',
            url: url.startsWith('http') ? url : `https://cointelegraph.com${url}`,
          });
        }
      });
    } catch (error) {
      console.error('Error scraping CoinTelegraph:', error);
    }
    return news;
  }

  private async getCryptoNews(): Promise<NewsArticle[]> {
    const [coindeskNews, cointelegraphNews] = await Promise.all([this.scrapeCoinDesk(), this.scrapeCoinTelegraph()]);
    return [...coindeskNews, ...cointelegraphNews];
  }

  public async execute(message: string): Promise<string> {
    try {
      const news = await this.getCryptoNews();
      const newsText = news.map((article) => `[${article.source}] ${article.title} (${article.url})`).join('\n');

      const prompt = await this.promptTemplate.format({ news: newsText });
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
