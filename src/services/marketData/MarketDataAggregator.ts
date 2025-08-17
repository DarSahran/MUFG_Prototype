import axios from 'axios';
import { MarketDataPoint } from '../../types/portfolioTypes';

interface MarketDataSource {
  name: string;
  getPrice(symbol: string): Promise<MarketDataPoint | null>;
  getHistoricalData(symbol: string, period: string): Promise<MarketDataPoint[]>;
  isAvailable(): boolean;
  getSupportedRegions(): string[];
}

class YahooFinanceAPI implements MarketDataSource {
  name = 'Yahoo Finance';
  private baseUrl = 'https://query1.finance.yahoo.com/v1/finance';

  async getPrice(symbol: string): Promise<MarketDataPoint | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: { symbols: symbol },
        timeout: 5000,
      });

      const quote = response.data.quoteResponse?.result?.[0];
      if (!quote) return null;

      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      return null;
    }
  }

  async getHistoricalData(symbol: string, period: string): Promise<MarketDataPoint[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/chart/${symbol}`, {
        params: { 
          range: period,
          interval: '1d',
        },
        timeout: 10000,
      });

      const result = response.data.chart?.result?.[0];
      if (!result) return [];

      const timestamps = result.timestamp;
      const prices = result.indicators?.quote?.[0];
      
      if (!timestamps || !prices) return [];

      return timestamps.map((timestamp: number, index: number) => ({
        symbol,
        price: prices.close[index],
        change: 0, // Would calculate from previous day
        changePercent: 0,
        volume: prices.volume[index],
        timestamp: new Date(timestamp * 1000).toISOString(),
      }));
    } catch (error) {
      console.error('Yahoo Finance historical data error:', error);
      return [];
    }
  }

  isAvailable(): boolean {
    return true; // Always available as fallback
  }

  getSupportedRegions(): string[] {
    return ['AU', 'US', 'IN', 'GLOBAL'];
  }
}

class AlphaVantageAPI implements MarketDataSource {
  name = 'Alpha Vantage';
  private apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
  private baseUrl = 'https://www.alphavantage.co/query';

  async getPrice(symbol: string): Promise<MarketDataPoint | null> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: this.apiKey,
        },
        timeout: 5000,
      });

      const quote = response.data['Global Quote'];
      if (!quote) return null;

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return null;
    }
  }

  async getHistoricalData(symbol: string, period: string): Promise<MarketDataPoint[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          apikey: this.apiKey,
        },
        timeout: 10000,
      });

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) return [];

      return Object.entries(timeSeries)
        .slice(0, 100)
        .map(([date, data]: [string, any]) => ({
          symbol,
          price: parseFloat(data['4. close']),
          change: 0,
          changePercent: 0,
          volume: parseInt(data['5. volume']),
          timestamp: new Date(date).toISOString(),
        }));
    } catch (error) {
      console.error('Alpha Vantage historical data error:', error);
      return [];
    }
  }

  isAvailable(): boolean {
    return this.apiKey !== 'demo';
  }

  getSupportedRegions(): string[] {
    return ['US', 'AU'];
  }
}

class CoinGeckoAPI implements MarketDataSource {
  name = 'CoinGecko';
  private baseUrl = 'https://api.coingecko.com/api/v3';

  async getPrice(symbol: string): Promise<MarketDataPoint | null> {
    try {
      // Convert symbol to CoinGecko ID
      const coinId = this.symbolToCoinId(symbol);
      if (!coinId) return null;

      const response = await axios.get(`${this.baseUrl}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: true,
        },
        timeout: 5000,
      });

      const data = response.data[coinId];
      if (!data) return null;

      return {
        symbol,
        price: data.usd,
        change: 0, // Would need additional calculation
        changePercent: data.usd_24h_change || 0,
        volume: 0, // Would need separate API call
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  }

  async getHistoricalData(symbol: string, period: string): Promise<MarketDataPoint[]> {
    try {
      const coinId = this.symbolToCoinId(symbol);
      if (!coinId) return [];

      const days = this.periodToDays(period);
      const response = await axios.get(`${this.baseUrl}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days,
        },
        timeout: 10000,
      });

      const prices = response.data.prices;
      if (!prices) return [];

      return prices.map(([timestamp, price]: [number, number]) => ({
        symbol,
        price,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: new Date(timestamp).toISOString(),
      }));
    } catch (error) {
      console.error('CoinGecko historical data error:', error);
      return [];
    }
  }

  isAvailable(): boolean {
    return true;
  }

  getSupportedRegions(): string[] {
    return ['GLOBAL'];
  }

  private symbolToCoinId(symbol: string): string | null {
    const mapping: { [key: string]: string } = {
      'BTC-USD': 'bitcoin',
      'ETH-USD': 'ethereum',
      'ADA-USD': 'cardano',
      'DOT-USD': 'polkadot',
    };
    return mapping[symbol] || null;
  }

  private periodToDays(period: string): number {
    switch (period) {
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '1Y': return 365;
      default: return 30;
    }
  }
}

export class MarketDataAggregator {
  private sources: MarketDataSource[];
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.sources = [
      new YahooFinanceAPI(),
      new AlphaVantageAPI(),
      new CoinGeckoAPI(),
    ];
  }

  async getAssetPrice(symbol: string, assetType: string, region: string): Promise<MarketDataPoint | null> {
    const cacheKey = `price_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const source = this.selectBestSource(assetType, region);
    const data = await source.getPrice(symbol);
    
    if (data) {
      this.setCachedData(cacheKey, data);
    }
    
    return data;
  }

  async getHistoricalData(symbol: string, period: string, assetType: string, region: string): Promise<MarketDataPoint[]> {
    const cacheKey = `historical_${symbol}_${period}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const source = this.selectBestSource(assetType, region);
    const data = await source.getHistoricalData(symbol, period);
    
    if (data.length > 0) {
      this.setCachedData(cacheKey, data);
    }
    
    return data;
  }

  async getMarketNews(symbols: string[]): Promise<any[]> {
    // Implementation for market news aggregation
    return [];
  }

  private selectBestSource(assetType: string, region: string): MarketDataSource {
    // Select best source based on asset type and region
    if (assetType === 'crypto') {
      return this.sources.find(s => s.name === 'CoinGecko') || this.sources[0];
    }
    
    if (region === 'US' && this.sources.find(s => s.name === 'Alpha Vantage')?.isAvailable()) {
      return this.sources.find(s => s.name === 'Alpha Vantage')!;
    }
    
    return this.sources.find(s => s.name === 'Yahoo Finance')!;
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
}

export const marketDataAggregator = new MarketDataAggregator();