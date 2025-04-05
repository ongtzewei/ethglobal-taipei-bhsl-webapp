declare module 'coingecko-api' {
  export default class CoinGecko {
    coins: {
      fetchMarketChart: (coinId: string, params: {
        vs_currency: string;
        days: string;
        interval: string;
      }) => Promise<{
        data: {
          prices: [number, number][];
          total_volumes: [number, number][];
          market_caps: [number, number][];
        };
      }>;
    };
  }
} 