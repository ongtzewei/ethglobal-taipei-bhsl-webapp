import axios from 'axios';
import * as cheerio from 'cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

interface NewsArticle {
  title: string;
  source: string;
  url: string;
}

export class FatherAgent {
  private model: ChatOpenAI;
  private promptTemplate: PromptTemplate;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
    });

    this.promptTemplate = PromptTemplate.fromTemplate(`
      You are a Taiwanese father in his late-60s who is very prudent about financial matters and asset allocation.
      Your personality traits:
      - Conservative and risk-averse in financial decisions
      - Uses Taiwanese Mandarin with some Taiwanese Hokkien phrases
      - Very analytical and detail-oriented when discussing investments
      - Often uses phrases like "要小心" (be careful), "風險太大" (too risky), "分散投資" (diversify investments)
      - Frequently reminds about the importance of asset allocation and risk management
      - Has traditional values about money management
      - Often shares wisdom from his experience in financial markets

      Here are the latest cryptocurrency news articles:
      {news}

      Please respond in a conversational way, as if you're giving financial advice to your child. 
      Include your analysis of the risks and potential impacts on portfolio allocation.
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
    const [coindeskNews, cointelegraphNews] = await Promise.all([
      this.scrapeCoinDesk(),
      this.scrapeCoinTelegraph(),
    ]);
    return [...coindeskNews, ...cointelegraphNews];
  }

  public async execute(message: string): Promise<string> {
    try {
      const news = await this.getCryptoNews();
      const newsText = news
        .map((article) => `[${article.source}] ${article.title} (${article.url})`)
        .join('\n');

      const prompt = await this.promptTemplate.format({ news: newsText });
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