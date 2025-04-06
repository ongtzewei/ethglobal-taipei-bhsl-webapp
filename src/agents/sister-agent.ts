import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import axios from 'axios';

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  category: 'forex' | 'stocks' | 'real-estate';
}

export class SisterAgent {
  role = 'sister';
  name = '姊寶';
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
      You are a Taiwanese sister in her early-30s who has a balanced approach to investments.
      Your personality traits:
      - Prefers traditional investments like stocks and real estate
      - Cautiously interested in cryptocurrency as a small part of portfolio
      - Uses conversational English with a practical tone
      - Very practical and research-oriented
      - Often uses phrases like "I think", "This looks promising", "Let's research this"
      - Likes to share investment tips and market insights
      - Focuses on long-term growth and stability
      - Occasionally mentions her real estate investments and stock portfolio
      - Sometimes compares crypto to traditional investments
      - Often mediates between conservative and aggressive investment approaches
      - Tends to be more diplomatic in her responses
      - Sometimes shares her research findings with the family

      Here are the latest market updates:

      Forex Market News:
      {forexNews}

      Stock Market News:
      {stockNews}

      Real Estate Market News:
      {realEstateNews}

      User's question: {userMessage}

      Please respond in a conversational way, as if you're discussing investments with your older brother.
      Keep it short and limit your response to 2-3 sentences.
      Include your thoughts on how this news might affect different asset classes and your investment strategy.
      Try to find common ground between different investment approaches in the family.
      Make specific references to the news when giving advice.
    `);
  }

  private async fetchNewsFromAPI(category: string): Promise<NewsArticle[]> {
    try {
      // Using NewsAPI (you'll need to set NEWSAPI_KEY in your environment variables)
      const apiKey = process.env.NEWSAPI_KEY;
      const response = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: category,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 5,
          apiKey: apiKey,
        },
      });

      return response.data.articles.map((article: any) => ({
        title: article.title,
        source: article.source.name,
        url: article.url,
        category: category as 'forex' | 'stocks' | 'real-estate',
      }));
    } catch (error) {
      console.error(`Error fetching ${category} news:`, error);
      return [];
    }
  }

  private async getFinancialNews(): Promise<{
    forex: NewsArticle[];
    stocks: NewsArticle[];
    realEstate: NewsArticle[];
  }> {
    try {
      const [forexNews, stockNews, realEstateNews] = await Promise.all([
        this.fetchNewsFromAPI('forex AND currency AND exchange'),
        this.fetchNewsFromAPI('stock AND market AND (NYSE OR NASDAQ)'),
        this.fetchNewsFromAPI('real estate AND property AND market'),
      ]);

      return {
        forex: forexNews,
        stocks: stockNews,
        realEstate: realEstateNews,
      };
    } catch (error) {
      console.error('Error fetching financial news:', error);
      return {
        forex: [],
        stocks: [],
        realEstate: [],
      };
    }
  }

  private formatNewsArticles(articles: NewsArticle[]): string {
    if (articles.length === 0) {
      return 'No recent news available.';
    }
    return articles.map((article) => `[${article.source}] ${article.title} (${article.url})`).join('\n');
  }

  public async execute(message: string): Promise<string> {
    try {
      const news = await this.getFinancialNews();

      const prompt = await this.promptTemplate.format({
        forexNews: this.formatNewsArticles(news.forex),
        stockNews: this.formatNewsArticles(news.stocks),
        realEstateNews: this.formatNewsArticles(news.realEstate),
        userMessage: message,
      });

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
