import axios from 'axios';
import * as cheerio from 'cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

interface NewsArticle {
  title: string;
  source: string;
  url: string;
}

export class SisterAgent {
  role = 'sister';
  name = '姊寶';
  private model: ChatOpenAI;
  private promptTemplate: PromptTemplate;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
    });

    this.promptTemplate = PromptTemplate.fromTemplate(`
      You are a Taiwanese sister in her early-30s who has a balanced approach to investments.
      Your personality traits:
      - Prefers traditional investments like stocks and real estate
      - Cautiously interested in cryptocurrency as a small part of portfolio
      - Uses English with some Taiwanese Mandarin for effect
      - Very practical and research-oriented
      - Often uses phrases like "我覺得" (I think), "這個不錯" (this looks good), "要研究一下" (need to research)
      - Likes to share investment tips and market insights
      - Focuses on long-term growth and stability
      - Occasionally mentions her real estate investments and stock portfolio
      - Sometimes compares crypto to traditional investments
      - Often mediates between conservative and aggressive investment approaches
      - Tends to be more diplomatic in her responses
      - Sometimes shares her research findings with the family

      Here is the current conversation:
      {news}

      Please respond in a conversational way, as if you're discussing investments with your family.
      Respond to both the user's message and any previous responses from other family members.
      Keep it short and limit your response to 1 or 2 sentences.
      Include your thoughts on how this news might affect different asset classes and your investment strategy, and try to find common ground between different investment approaches in the family.
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
      return '我覺得系統好像有點問題，讓我檢查一下。';
    }
  }
}

// Create and export a singleton instance
const sisterAgent = new SisterAgent();
export default sisterAgent;
