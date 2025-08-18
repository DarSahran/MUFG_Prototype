import axios from 'axios';
import { debounce } from 'lodash';

export interface RealTimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  source: string;
}

export interface MarketDataConfig {
  yahooFinanceEnabled: boolean;
  alphaVantageEnabled: boolean;
  coinGeckoEnabled: boolean;
  updateInterval: number;
  maxRetries: number;
}

class RealTimeMarketDataService {
  private config: MarketDataConfig;
  private cache = new Map<string, { data: RealTimePrice; timestamp: number }>();
  private subscribers = new Map<string, Set<(data: RealTimePrice) => void>>();
  private updateIntervals = new Map<string, NodeJS.Timeout>();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly API_KEYS = {
    alphaVantage: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo',
    yahooFinance: 'public', // Yahoo Finance doesn't require API key
  };

  constructor() {
    this.config = {
      yahooFinanceEnabled: true,
      alphaVantageEnabled: this.API_KEYS.alphaVantage !== 'demo',
      coinGeckoEnabled: true,
      updateInterval: 30000, // 30 seconds
      maxRetries: 3,
    };
  }

  /**
   * Subscribe to real-time price updates for a symbol
   */
  subscribe(symbol: string, callback: (data: RealTimePrice) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
      this.startPriceUpdates(symbol);
    }

    this.subscribers.get(symbol)!.add(callback);

    // Return unsubscribe function
    return () => {
      const symbolSubscribers = this.subscribers.get(symbol);
      if (symbolSubscribers) {
        symbolSubscribers.delete(callback);
        if (symbolSubscribers.size === 0) {
          this.stopPriceUpdates(symbol);
          this.subscribers.delete(symbol);
        }
      }
    };
  }

  /**
   * Get current price for a symbol
   */
  async getCurrentPrice(symbol: string, assetType: string = 'stock'): Promise<RealTimePrice | null> {
    const cached = this.getCachedPrice(symbol);
    if (cached) return cached;

    try {
      let price: RealTimePrice | null = null;

      switch (assetType) {
        case 'crypto':
          price = await this.getCryptoPrice(symbol);
          break;
        case 'stock':
        case 'etf':
        default:
          price = await this.getStockPrice(symbol);
          break;
      }

      if (price) {
        this.setCachedPrice(symbol, price);
        this.notifySubscribers(symbol, price);
      }

      return price;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return this.getMockPrice(symbol);
    }
  }

  /**
   * Get multiple prices at once
   */
  async getMultiplePrices(symbols: string[], assetTypes: { [symbol: string]: string } = {}): Promise<{ [symbol: string]: RealTimePrice }> {
    const results: { [symbol: string]: RealTimePrice } = {};
    
    const pricePromises = symbols.map(async (symbol) => {
      const assetType = assetTypes[symbol] || 'stock';
      const price = await this.getCurrentPrice(symbol, assetType);
      if (price) {
        results[symbol] = price;
      }
    });

    await Promise.allSettled(pricePromises);
    return results;
  }

  private async getStockPrice(symbol: string): Promise<RealTimePrice | null> {
    // Try Yahoo Finance first
    if (this.config.yahooFinanceEnabled) {
      try {
        const response = await axios.get('https://query1.finance.yahoo.com/v1/finance/quote', {
          params: { symbols: symbol },
          timeout: 5000,
        });

        const quote = response.data.quoteResponse?.result?.[0];
        if (quote) {
          return {
            symbol: quote.symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            timestamp: new Date().toISOString(),
            source: 'Yahoo Finance',
          };
        }
      } catch (error) {
        console.warn('Yahoo Finance failed for', symbol, error);
      }
    }

    // Fallback to Alpha Vantage
    if (this.config.alphaVantageEnabled) {
      try {
        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol,
            apikey: this.API_KEYS.alphaVantage,
          },
          timeout: 5000,
        });

        const quote = response.data['Global Quote'];
        if (quote) {
          return {
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume']),
            timestamp: new Date().toISOString(),
            source: 'Alpha Vantage',
          };
        }
      } catch (error) {
        console.warn('Alpha Vantage failed for', symbol, error);
      }
    }

    return null;
  }

  private async getCryptoPrice(symbol: string): Promise<RealTimePrice | null> {
    if (!this.config.coinGeckoEnabled) return null;

    try {
      const coinId = this.symbolToCoinGeckoId(symbol);
      if (!coinId) return null;

      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: true,
        },
        timeout: 5000,
      });

      const data = response.data[coinId];
      if (data) {
        return {
          symbol,
          price: data.usd,
          change: 0, // CoinGecko doesn't provide absolute change
          changePercent: data.usd_24h_change || 0,
          volume: 0, // Would need separate API call
          timestamp: new Date().toISOString(),
          source: 'CoinGecko',
        };
      }
    } catch (error) {
      console.warn('CoinGecko failed for', symbol, error);
    }

    return null;
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
      'AVAX-USD': 'avalanche-2',
      'ATOM-USD': 'cosmos',
    };
    return mapping[symbol] || null;
  }

  private startPriceUpdates(symbol: string): void {
    const updatePrice = async () => {
      try {
        const price = await this.getCurrentPrice(symbol);
        if (price) {
          this.notifySubscribers(symbol, price);
        }
      } catch (error) {
        console.error(`Error updating price for ${symbol}:`, error);
      }
    };

    // Initial update
    updatePrice();

    // Set up interval
    const interval = setInterval(updatePrice, this.config.updateInterval);
    this.updateIntervals.set(symbol, interval);
  }

  private stopPriceUpdates(symbol: string): void {
    const interval = this.updateIntervals.get(symbol);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(symbol);
    }
  }

  private notifySubscribers(symbol: string, price: RealTimePrice): void {
    const subscribers = this.subscribers.get(symbol);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(price);
        } catch (error) {
          console.error('Error notifying subscriber:', error);
        }
      });
    }
  }

  private getCachedPrice(symbol: string): RealTimePrice | null {
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedPrice(symbol: string, price: RealTimePrice): void {
    this.cache.set(symbol, { data: price, timestamp: Date.now() });
  }

  private getMockPrice(symbol: string): RealTimePrice {
    const mockPrices: { [key: string]: Omit<RealTimePrice, 'timestamp' | 'source'> } = {
      'VAS.AX': { symbol: 'VAS.AX', price: 89.45, change: 1.23, changePercent: 1.39, volume: 125000 },
      'VGS.AX': { symbol: 'VGS.AX', price: 102.67, change: -0.45, changePercent: -0.44, volume: 89000 },
      'VAF.AX': { symbol: 'VAF.AX', price: 51.23, change: 0.12, changePercent: 0.23, volume: 45000 },
      'CBA.AX': { symbol: 'CBA.AX', price: 104.50, change: -1.20, changePercent: -1.13, volume: 890000 },
      'BTC-USD': { symbol: 'BTC-USD', price: 45000, change: 1200, changePercent: 2.74, volume: 25000000000 },
      'ETH-USD': { symbol: 'ETH-USD', price: 3200, change: -45, changePercent: -1.39, volume: 15000000000 },
    };

    const mockData = mockPrices[symbol] || {
      symbol,
      price: 100 + Math.random() * 50,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
    };

    return {
      ...mockData,
      timestamp: new Date().toISOString(),
      source: 'Mock Data',
    };
  }

  /**
   * Batch update prices in Supabase
   */
  async updatePricesInDatabase(prices: { [symbol: string]: RealTimePrice }): Promise<void> {
    try {
      const { supabase } = await import('../lib/supabase');
      
      const priceUpdates = Object.values(prices).map(price => ({
        symbol: price.symbol,
        price: price.price,
        timestamp: price.timestamp,
      }));

      // Call the database function to update prices
      const { error } = await supabase.rpc('update_asset_prices', {
        price_updates: priceUpdates,
      });

      if (error) {
        console.error('Error updating prices in database:', error);
      }
    } catch (error) {
      console.error('Error connecting to database:', error);
    }
  }

  /**
   * Get price history for charting
   */
  async getPriceHistory(symbol: string, days: number = 30): Promise<RealTimePrice[]> {
    try {
      const { supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('symbol', symbol)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data.map(row => ({
        symbol: row.symbol,
        price: Number(row.price),
        change: 0,
        changePercent: Number(row.change_percent) || 0,
        volume: Number(row.volume) || 0,
        timestamp: row.timestamp,
        source: row.source || 'Database',
      }));
    } catch (error) {
      console.error('Error fetching price history:', error);
      return this.generateMockHistory(symbol, days);
    }
  }

  private generateMockHistory(symbol: string, days: number): RealTimePrice[] {
    const history: RealTimePrice[] = [];
    const basePrice = 100;
    let currentPrice = basePrice;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate price movement
      const change = (Math.random() - 0.5) * 0.05; // ±2.5% daily change
      currentPrice *= (1 + change);
      
      history.push({
        symbol,
        price: currentPrice,
        change: currentPrice - basePrice,
        changePercent: ((currentPrice - basePrice) / basePrice) * 100,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: date.toISOString(),
        source: 'Mock Data',
      });
    }

    return history;
  }

  /**
   * Search for tradeable assets
   */
  async searchTradableAssets(query: string, assetType: string = '', region: string = 'AU'): Promise<any[]> {
    if (!query || query.length < 2) return [];

    try {
      // Search Yahoo Finance
      const response = await axios.get('https://query1.finance.yahoo.com/v1/finance/search', {
        params: {
          q: query,
          quotesCount: 20,
          newsCount: 0,
        },
        timeout: 5000,
      });

      let results = response.data.quotes || [];

      // Filter by asset type if specified
      if (assetType) {
        results = results.filter((quote: any) => {
          const type = this.mapYahooTypeToAssetType(quote.typeDisp);
          return type === assetType;
        });
      }

      // Filter by region if specified
      if (region) {
        results = results.filter((quote: any) => {
          const assetRegion = this.mapExchangeToRegion(quote.exchange);
          return assetRegion === region || assetRegion === 'GLOBAL';
        });
      }

      return results.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        type: this.mapYahooTypeToAssetType(quote.typeDisp),
        exchange: quote.exchange,
        currency: quote.currency || 'USD',
        region: this.mapExchangeToRegion(quote.exchange),
        currentPrice: quote.regularMarketPrice,
        marketCap: quote.marketCap,
        sector: quote.sector,
        description: quote.longname,
      }));
    } catch (error) {
      console.error('Error searching assets:', error);
      return [];
    }
  }

  /**
   * Get market news for symbols
   */
  async getMarketNews(symbols: string[] = []): Promise<any[]> {
    try {
      if (!this.config.alphaVantageEnabled) {
        return this.getMockNews();
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbols.join(',') || 'AAPL,GOOGL,MSFT',
          apikey: this.API_KEYS.alphaVantage,
          limit: 10,
        },
        timeout: 10000,
      });

      return response.data.feed?.map((item: any) => ({
        title: item.title,
        summary: item.summary,
        url: item.url,
        source: item.source,
        publishedAt: item.time_published,
        sentiment: item.overall_sentiment_label?.toLowerCase() || 'neutral',
        relevanceScore: item.relevance_score,
      })) || [];
    } catch (error) {
      console.error('Error fetching market news:', error);
      return this.getMockNews();
    }
  }

  private mapYahooTypeToAssetType(yahooType: string): string {
    const typeMap: { [key: string]: string } = {
      'EQUITY': 'stock',
      'ETF': 'etf',
      'MUTUALFUND': 'mutual-fund',
      'INDEX': 'index',
      'CRYPTOCURRENCY': 'crypto',
      'BOND': 'bond',
    };
    return typeMap[yahooType?.toUpperCase()] || 'stock';
  }

  private mapExchangeToRegion(exchange: string): string {
    const exchangeMap: { [key: string]: string } = {
      'ASX': 'AU',
      'NYSE': 'US',
      'NASDAQ': 'US',
      'NSE': 'IN',
      'BSE': 'IN',
      'LSE': 'EU',
      'CCC': 'GLOBAL', // Crypto
    };
    return exchangeMap[exchange] || 'GLOBAL';
  }

  private getMockNews(): any[] {
    return [
      {
        title: 'ASX 200 Reaches New High Amid Strong Earnings Season',
        summary: 'The Australian stock market continues its upward trajectory with strong corporate earnings driving investor confidence across multiple sectors.',
        url: '#',
        source: 'Financial Review',
        publishedAt: new Date().toISOString(),
        sentiment: 'positive',
        relevanceScore: 0.8,
      },
      {
        title: 'RBA Maintains Cash Rate at 4.35% as Inflation Moderates',
        summary: 'The Reserve Bank of Australia holds interest rates steady, citing balanced economic conditions and moderating inflation pressures.',
        url: '#',
        source: 'ABC News',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        sentiment: 'neutral',
        relevanceScore: 0.7,
      },
      {
        title: 'Technology Sector Leads Market Rally',
        summary: 'Tech stocks surge as AI adoption accelerates across industries, with local tech companies reporting strong quarterly results.',
        url: '#',
        source: 'Sydney Morning Herald',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        sentiment: 'positive',
        relevanceScore: 0.6,
      },
    ];
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
    
    // Clear subscribers
    this.subscribers.clear();
    
    // Clear cache
    this.cache.clear();
  }
}

export const realTimeMarketDataService = new RealTimeMarketDataService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realTimeMarketDataService.destroy();
  });
}