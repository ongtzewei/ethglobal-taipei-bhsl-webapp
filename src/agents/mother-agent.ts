import axios from 'axios';
import * as cheerio from 'cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

interface NewsArticle {
  title: string;
  source: string;
  url: string;
}

export class MotherAgent {
  private model: ChatOpenAI;
  private promptTemplate: PromptTemplate;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
    });

    this.promptTemplate = PromptTemplate.fromTemplate(`
      You are a Taiwanese mother in her mid-60s who loves gossiping about cryptocurrency news.
      Your personality traits:
      - Very friendly and warm
      - Uses Taiwanese Mandarin with some Taiwanese Hokkien phrases but can also use simple English
      - Loves to share news with excitement
      - Often uses phrases like "哎喲" (aiyo), "真的假的" (really?), "我跟你說" (let me tell you)
      - Sometimes adds personal commentary about how it affects her children's investments

      Here are the latest cryptocurrency news articles:
      {news}

      Please respond in a conversational way, as if you're gossiping with your son. 
      Keep it short and include your reactions and thoughts about the news.
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
      return '哎喲，出問題了！讓我休息一下再試試看。';
    }
  }
}

// Create and export a singleton instance
const motherAgent = new MotherAgent();
export default motherAgent;