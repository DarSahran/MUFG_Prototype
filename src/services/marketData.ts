import axios from 'axios';
import { apiRateLimiter } from '../utils/apiRateLimiter';

const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
const YAHOO_FINANCE_URL = 'https://query1.finance.yahoo.com/v1/finance';
const COINGECKO_URL = 'https://api.coingecko.com/api/v3';

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
}

export interface ChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketNews {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

class MarketDataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async fetchWithFallback(primaryFetch: () => Promise<any>, fallbackData: any) {
    try {
      return await primaryFetch();
    } catch (error) {
      console.warn('Primary API failed, using fallback data:', error);
      return fallbackData;
    }
  }

  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getStockQuote(symbol: string): Promise<StockData | null> {
    const cacheKey = `quote_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    return this.fetchWithFallback(
      async () => {
        await apiRateLimiter.acquireToken();
        
        // Try Yahoo Finance first
        try {
          const response = await axios.get(`${YAHOO_FINANCE_URL}/quote`, {
            params: { symbols: symbol },
            timeout: 5000,
          });

          const quote = response.data.quoteResponse?.result?.[0];
          if (quote) {
            const stockData: StockData = {
              symbol: quote.symbol,
              price: quote.regularMarketPrice,
              change: quote.regularMarketChange,
              changePercent: quote.regularMarketChangePercent,
              volume: quote.regularMarketVolume,
              marketCap: quote.marketCap,
              pe: quote.trailingPE,
              dividend: quote.dividendYield,
            };
            this.setCachedData(cacheKey, stockData);
            return stockData;
          }
        } catch (yahooError) {
          console.warn('Yahoo Finance failed, trying Alpha Vantage:', yahooError);
        }

        await apiRateLimiter.acquireToken();
        
        // Fallback to Alpha Vantage
        const response = await axios.get(ALPHA_VANTAGE_URL, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol,
            apikey: ALPHA_VANTAGE_API_KEY,
          },
          timeout: 5000,
        });

        const quote = response.data['Global Quote'];
        if (!quote) throw new Error('No quote data');

        const stockData: StockData = {
          symbol: quote['01. symbol'],
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
        };

        this.setCachedData(cacheKey, stockData);
        return stockData;
      },
      this.getMockStockData(symbol)
    );
  }

  async getHistoricalData(symbol: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<ChartData[]> {
    const cacheKey = `historical_${symbol}_${period}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    return this.fetchWithFallback(
      async () => {
        await apiRateLimiter.acquireToken();
        
        const functionMap = {
          daily: 'TIME_SERIES_DAILY',
          weekly: 'TIME_SERIES_WEEKLY',
          monthly: 'TIME_SERIES_MONTHLY',
        };

        const response = await axios.get(ALPHA_VANTAGE_URL, {
          params: {
            function: functionMap[period],
            symbol,
            apikey: ALPHA_VANTAGE_API_KEY,
          },
          timeout: 10000,
        });

        const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
        if (!timeSeriesKey) throw new Error('No time series data');

        const timeSeries = response.data[timeSeriesKey];
        const chartData: ChartData[] = Object.entries(timeSeries)
          .slice(0, 100)
          .map(([date, data]: [string, any]) => ({
            date,
            open: parseFloat(data['1. open']),
            high: parseFloat(data['2. high']),
            low: parseFloat(data['3. low']),
            close: parseFloat(data['4. close']),
            volume: parseInt(data['5. volume']),
          }))
          .reverse();

        this.setCachedData(cacheKey, chartData);
        return chartData;
      },
      this.getMockChartData()
    );
  }

  async getCryptoPrice(symbol: string): Promise<StockData | null> {
    const cacheKey = `crypto_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    return this.fetchWithFallback(
      async () => {
        await apiRateLimiter.acquireToken();
        
        const coinId = this.symbolToCoinGeckoId(symbol);
        if (!coinId) throw new Error('Unsupported crypto symbol');

        const response = await axios.get(`${COINGECKO_URL}/simple/price`, {
          params: {
            ids: coinId,
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_market_cap: true,
          },
          timeout: 5000,
        });

        const data = response.data[coinId];
        if (!data) throw new Error('No crypto data');

        const cryptoData: StockData = {
          symbol,
          price: data.usd,
          change: 0, // Would need additional calculation
          changePercent: data.usd_24h_change || 0,
          volume: 0, // Would need separate API call
          marketCap: data.usd_market_cap,
        };

        this.setCachedData(cacheKey, cryptoData);
        return cryptoData;
      },
      this.getMockCryptoData(symbol)
    );
  }

  private symbolToCoinGeckoId(symbol: string): string | null {
    const mapping: { [key: string]: string } = {
      'BTC-USD': 'bitcoin',
      'ETH-USD': 'ethereum',
      'ADA-USD': 'cardano',
      'DOT-USD': 'polkadot',
      'LINK-USD': 'chainlink',
      'UNI-USD': 'uniswap',
      'MATIC-USD': 'matic-network',
      'SOL-USD': 'solana',
    };
    return mapping[symbol] || null;
  }

  async getMarketNews(symbols: string[] = []): Promise<MarketNews[]> {
    const cacheKey = `news_${symbols.join(',')}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    return this.fetchWithFallback(
      async () => {
        await apiRateLimiter.acquireToken();
        
        const response = await axios.get(ALPHA_VANTAGE_URL, {
          params: {
            function: 'NEWS_SENTIMENT',
            tickers: symbols.join(',') || 'AAPL,GOOGL,MSFT',
            apikey: ALPHA_VANTAGE_API_KEY,
          },
          timeout: 10000,
        });

        const news: MarketNews[] = response.data.feed?.slice(0, 10).map((item: any) => ({
          title: item.title,
          summary: item.summary,
          url: item.url,
          source: item.source,
          publishedAt: item.time_published,
          sentiment: item.overall_sentiment_label?.toLowerCase() || 'neutral',
        })) || [];

        this.setCachedData(cacheKey, news);
        return news;
      },
      this.getMockNews()
    );
  }

  // Mock data for demo purposes when API is not available
  getMockStockData(symbol: string): StockData {
    const mockData = {
      'VAS.AX': { symbol: 'VAS.AX', price: 89.45, change: 1.23, changePercent: 1.39, volume: 125000 },
      'VGS.AX': { symbol: 'VGS.AX', price: 102.67, change: -0.45, changePercent: -0.44, volume: 89000 },
      'VAF.AX': { symbol: 'VAF.AX', price: 51.23, change: 0.12, changePercent: 0.23, volume: 45000 },
      'VGE.AX': { symbol: 'VGE.AX', price: 67.89, change: 0.78, changePercent: 1.16, volume: 67000 },
      'CBA.AX': { symbol: 'CBA.AX', price: 104.50, change: -1.20, changePercent: -1.13, volume: 890000 },
      'BHP.AX': { symbol: 'BHP.AX', price: 46.78, change: 0.89, changePercent: 1.94, volume: 1200000 },
      'VAS': { symbol: 'VAS', price: 89.45, change: 1.23, changePercent: 1.39, volume: 125000 },
      'VGS': { symbol: 'VGS', price: 102.67, change: -0.45, changePercent: -0.44, volume: 89000 },
      'VAF': { symbol: 'VAF', price: 51.23, change: 0.12, changePercent: 0.23, volume: 45000 },
    };
    return mockData[symbol as keyof typeof mockData] || { symbol, price: 100, change: 0, changePercent: 0, volume: 0 };
  }

  getMockCryptoData(symbol: string): StockData {
    const mockData = {
      'BTC-USD': { symbol: 'BTC-USD', price: 45000, change: 1200, changePercent: 2.74, volume: 25000000000, marketCap: 850000000000 },
      'ETH-USD': { symbol: 'ETH-USD', price: 3200, change: -45, changePercent: -1.39, volume: 15000000000, marketCap: 380000000000 },
      'ADA-USD': { symbol: 'ADA-USD', price: 0.45, change: 0.02, changePercent: 4.65, volume: 500000000, marketCap: 15000000000 },
    };
    return mockData[symbol as keyof typeof mockData] || { symbol, price: 1, change: 0, changePercent: 0, volume: 0 };
  }

  getMockNews(): MarketNews[] {
    return [
      {
        title: 'ASX 200 Reaches New High Amid Strong Earnings',
        summary: 'The Australian stock market continues its upward trajectory with strong corporate earnings driving investor confidence.',
        url: '#',
        source: 'Financial Review',
        publishedAt: new Date().toISOString(),
        sentiment: 'positive',
      },
      {
        title: 'RBA Holds Interest Rates Steady',
        summary: 'The Reserve Bank of Australia maintains the cash rate at 4.35%, citing balanced economic conditions.',
        url: '#',
        source: 'ABC News',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        sentiment: 'neutral',
      },
    ];
  }

  getMockChartData(): ChartData[] {
    const data: ChartData[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const basePrice = 100 + Math.sin(i / 5) * 10;
      const volatility = Math.random() * 4 - 2;
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: basePrice + volatility,
        high: basePrice + volatility + Math.random() * 3,
        low: basePrice + volatility - Math.random() * 3,
        close: basePrice + volatility + (Math.random() - 0.5) * 2,
        volume: Math.floor(Math.random() * 100000) + 50000,
      });
    }

    return data;
  }
}

export const marketDataService = new MarketDataService();