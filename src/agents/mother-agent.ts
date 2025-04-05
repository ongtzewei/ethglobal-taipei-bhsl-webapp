import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import axios from 'axios';


interface NewsArticle {
  title: string;
  source: string;
  url: string;
  category: 'web3' | 'money' | 'entertainment' | 'scandal' | 'politics';
}

export class MotherAgent {
  role = 'mother';
  name: string = '阿母';
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
      You are a Taiwanese mother in her mid-60s who loves gossiping about all type of news.
      Your personality traits:
      - Very friendly and warm
      - Uses English mainly with some Taiwanese Mandarin and Hokkien phrases
      - Loves to share news with excitement
      - Often uses phrases like "哎喲", "真的假的", "我跟你說"
      - Sometimes adds personal commentary about how it affects her children's investments
      - Often agrees with or questions other family members' opinions
      - Sometimes shares her own experiences with investments
      - Tends to be more emotional in her responses
      - Loves to share gossip and scandals
      - Often connects different news stories together in interesting ways
      - Frequently expresses concern about money and investments

      Here are the latest updates I found:

      Web3 and Crypto News:
      {web3News}

      Money and Investment News:
      {moneyNews}

      Entertainment Gossip:
      {entertainmentNews}

      Latest Scandals:
      {scandalNews}

      Latest Political News:
      {politicalNews}

      User's question: {userMessage}

      Please respond in a conversational way, as if you're gossiping with your older son. 
      Connect different pieces of news together in an interesting way.
      Keep it short and limit your response to 2-3 sentences.
      Include your reactions and thoughts about the news.
      Make sure to include at least one link to a news article you're discussing.
      Add some drama and excitement to your response using Taiwanese expressions.
    `);
  }

  private async searchNewsCategory(category: string): Promise<NewsArticle[]> {
    try {


      const apiKey = process.env.NEWSAPI_KEY;
      const response = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: category,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 5,
          apiKey: apiKey
        }
      });

      const articles = response.data.articles.map((article: any) => ({
        title: article.title,
        source: article.source.name,
        url: article.url,
        category: category as 'web3' |'money' | 'entertainment' |'scandal' | 'politics'
      }));

      return articles.slice(0, 3); // Limit to top 3 results
    } catch (error) {
      console.error(`Error searching ${category} news:`, error);
      return [];
    }
  }

  private async getGossipNews(): Promise<{
    web3: NewsArticle[];
    money: NewsArticle[];
    entertainment: NewsArticle[];
    scandal: NewsArticle[];
    politics: NewsArticle[];
  }> {
    try {
      const [web3News, moneyNews, entertainmentNews, scandalNews, politicalNews] = await Promise.all([
        this.searchNewsCategory('web3 crypto blockchain'),
        this.searchNewsCategory('money finance investment'),
        this.searchNewsCategory('entertainment celebrity gossip'),
        this.searchNewsCategory('scandal controversy news'),
        this.searchNewsCategory('politics'),
      ]);

      return {
        web3: web3News,
        money: moneyNews,
        entertainment: entertainmentNews,
        scandal: scandalNews,
        politics: politicalNews,
      };
    } catch (error) {
      console.error('Error fetching news:', error);
      return {
        web3: [],
        money: [],
        entertainment: [],
        scandal: [],
        politics: []
      };
    }
  }

  private formatNewsArticles(articles: NewsArticle[]): string {
    if (articles.length === 0) {
      return '哎喲，最近都沒有什麼新聞耶！';
    }
    return articles
      .map((article) => `[${article.source}] ${article.title} (${article.url})`)
      .join('\n');
  }

  public async execute(message: string): Promise<string> {
    try {
      const news = await this.getGossipNews();

      const prompt = await this.promptTemplate.format({
        web3News: this.formatNewsArticles(news.web3),
        moneyNews: this.formatNewsArticles(news.money),
        entertainmentNews: this.formatNewsArticles(news.entertainment),
        scandalNews: this.formatNewsArticles(news.scandal),
        politicalNews: this.formatNewsArticles(news.politics),
        userMessage: message
      });

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
