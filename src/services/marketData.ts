import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
const BASE_URL = 'https://www.alphavantage.co/query';

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

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
      });

      const quote = response.data['Global Quote'];
      if (!quote) return null;

      const stockData: StockData = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
      };

      this.setCachedData(cacheKey, stockData);
      return stockData;
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      return null;
    }
  }

  async getHistoricalData(symbol: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<ChartData[]> {
    const cacheKey = `historical_${symbol}_${period}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const functionMap = {
        daily: 'TIME_SERIES_DAILY',
        weekly: 'TIME_SERIES_WEEKLY',
        monthly: 'TIME_SERIES_MONTHLY',
      };

      const response = await axios.get(BASE_URL, {
        params: {
          function: functionMap[period],
          symbol,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
      });

      const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
      if (!timeSeriesKey) return [];

      const timeSeries = response.data[timeSeriesKey];
      const chartData: ChartData[] = Object.entries(timeSeries)
        .slice(0, 100) // Last 100 data points
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
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  async getMarketNews(symbols: string[] = []): Promise<MarketNews[]> {
    const cacheKey = `news_${symbols.join(',')}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbols.join(',') || 'AAPL,GOOGL,MSFT',
          apikey: ALPHA_VANTAGE_API_KEY,
        },
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
    } catch (error) {
      console.error('Error fetching market news:', error);
      return [];
    }
  }

  // Mock data for demo purposes when API is not available
  getMockStockData(symbol: string): StockData {
    const mockData = {
      'VAS.AX': { symbol: 'VAS.AX', price: 89.45, change: 1.23, changePercent: 1.39, volume: 125000 },
      'VGS.AX': { symbol: 'VGS.AX', price: 102.67, change: -0.45, changePercent: -0.44, volume: 89000 },
      'VAF.AX': { symbol: 'VAF.AX', price: 51.23, change: 0.12, changePercent: 0.23, volume: 45000 },
      'VAS': { symbol: 'VAS', price: 89.45, change: 1.23, changePercent: 1.39, volume: 125000 },
      'VGS': { symbol: 'VGS', price: 102.67, change: -0.45, changePercent: -0.44, volume: 89000 },
      'VAF': { symbol: 'VAF', price: 51.23, change: 0.12, changePercent: 0.23, volume: 45000 },
    };
    return mockData[symbol as keyof typeof mockData] || { symbol, price: 100, change: 0, changePercent: 0, volume: 0 };
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