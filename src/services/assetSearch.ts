import axios from 'axios';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';

export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'bond' | 'crypto' | 'mutual-fund' | 'index';
  exchange: string;
  currency: string;
  region: 'AU' | 'US' | 'IN' | 'GLOBAL';
  currentPrice?: number;
  marketCap?: number;
  sector?: string;
  description?: string;
  logo?: string;
}

export interface AssetDetails extends AssetSearchResult {
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio?: number;
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  description: string;
  sector: string;
  industry?: string;
  employees?: number;
  website?: string;
}

class AssetSearchService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v1/finance';
  
  // Predefined popular assets for quick access
  private popularAssets: AssetSearchResult[] = [
    // Australian Assets
    { symbol: 'VAS.AX', name: 'Vanguard Australian Shares Index ETF', type: 'etf', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'Diversified' },
    { symbol: 'VGS.AX', name: 'Vanguard MSCI Index International Shares ETF', type: 'etf', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'International' },
    { symbol: 'VAF.AX', name: 'Vanguard Australian Fixed Interest Index ETF', type: 'etf', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'Fixed Income' },
    { symbol: 'VGE.AX', name: 'Vanguard FTSE Emerging Markets Shares ETF', type: 'etf', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'Emerging Markets' },
    { symbol: 'CBA.AX', name: 'Commonwealth Bank of Australia', type: 'stock', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'Financial Services' },
    { symbol: 'BHP.AX', name: 'BHP Group Limited', type: 'stock', exchange: 'ASX', currency: 'AUD', region: 'AU', sector: 'Materials' },
    
    // US Assets
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf', exchange: 'NYSE', currency: 'USD', region: 'US', sector: 'Diversified' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', exchange: 'NASDAQ', currency: 'USD', region: 'US', sector: 'Technology' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', exchange: 'NYSE', currency: 'USD', region: 'US', sector: 'Diversified' },
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ', currency: 'USD', region: 'US', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', exchange: 'NASDAQ', currency: 'USD', region: 'US', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ', currency: 'USD', region: 'US', sector: 'Technology' },
    
    // Indian Assets
    { symbol: 'NIFTYBEES.NS', name: 'Nippon India ETF Nifty BeES', type: 'etf', exchange: 'NSE', currency: 'INR', region: 'IN', sector: 'Diversified' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', type: 'stock', exchange: 'NSE', currency: 'INR', region: 'IN', sector: 'Energy' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', type: 'stock', exchange: 'NSE', currency: 'INR', region: 'IN', sector: 'Technology' },
    
    // Crypto
    { symbol: 'BTC-USD', name: 'Bitcoin USD', type: 'crypto', exchange: 'CCC', currency: 'USD', region: 'GLOBAL', sector: 'Cryptocurrency' },
    { symbol: 'ETH-USD', name: 'Ethereum USD', type: 'crypto', exchange: 'CCC', currency: 'USD', region: 'GLOBAL', sector: 'Cryptocurrency' },
  ];

  private fuse = new Fuse(this.popularAssets, {
    keys: ['symbol', 'name', 'sector'],
    threshold: 0.3,
    includeScore: true,
  });

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

  /**
   * Search for assets using Yahoo Finance API
   */
  async searchAssets(query: string, limit: number = 10): Promise<AssetSearchResult[]> {
    if (!query || query.length < 2) {
      return this.getPopularAssets().slice(0, limit);
    }

    const cacheKey = `search_${query}_${limit}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // First, search in popular assets
      const popularResults = this.fuse.search(query).map(result => result.item);
      
      // Then search Yahoo Finance API
      const response = await axios.get(`${this.YAHOO_FINANCE_API}/search`, {
        params: {
          q: query,
          quotesCount: limit,
          newsCount: 0,
        },
        timeout: 5000,
      });

      const yahooResults: AssetSearchResult[] = response.data.quotes?.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        type: this.mapYahooTypeToAssetType(quote.typeDisp),
        exchange: quote.exchange || 'Unknown',
        currency: quote.currency || 'USD',
        region: this.mapExchangeToRegion(quote.exchange),
        currentPrice: quote.regularMarketPrice,
        marketCap: quote.marketCap,
        sector: quote.sector,
      })) || [];

      // Combine and deduplicate results
      const combinedResults = [...popularResults, ...yahooResults];
      const uniqueResults = combinedResults.filter((asset, index, self) => 
        index === self.findIndex(a => a.symbol === asset.symbol)
      ).slice(0, limit);

      this.setCachedData(cacheKey, uniqueResults);
      return uniqueResults;

    } catch (error) {
      console.error('Error searching assets:', error);
      // Fallback to popular assets search
      return this.fuse.search(query).map(result => result.item).slice(0, limit);
    }
  }

  /**
   * Get detailed information about a specific asset
   */
  async getAssetDetails(symbol: string): Promise<AssetDetails | null> {
    const cacheKey = `details_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [quoteResponse, summaryResponse] = await Promise.all([
        axios.get(`${this.YAHOO_FINANCE_API}/quote`, {
          params: { symbols: symbol },
          timeout: 5000,
        }),
        axios.get(`${this.YAHOO_FINANCE_API}/quoteSummary/${symbol}`, {
          params: { modules: 'assetProfile,summaryDetail,price' },
          timeout: 5000,
        }).catch(() => null), // Summary might not be available for all assets
      ]);

      const quote = quoteResponse.data.quoteResponse?.result?.[0];
      if (!quote) return null;

      const summary = summaryResponse?.data.quoteSummary?.result?.[0];
      const profile = summary?.assetProfile;
      const summaryDetail = summary?.summaryDetail;

      const assetDetails: AssetDetails = {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || quote.symbol,
        type: this.mapYahooTypeToAssetType(quote.typeDisp),
        exchange: quote.fullExchangeName || quote.exchange,
        currency: quote.currency || 'USD',
        region: this.mapExchangeToRegion(quote.exchange),
        currentPrice: quote.regularMarketPrice,
        previousClose: quote.regularMarketPreviousClose,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        avgVolume: quote.averageDailyVolume3Month,
        marketCap: quote.marketCap,
        peRatio: quote.trailingPE,
        dividendYield: quote.dividendYield,
        beta: summaryDetail?.beta?.raw,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        description: profile?.longBusinessSummary || `${quote.longName || quote.shortName} trading on ${quote.exchange}`,
        sector: profile?.sector || quote.sector || 'Unknown',
        industry: profile?.industry,
        employees: profile?.fullTimeEmployees,
        website: profile?.website,
      };

      this.setCachedData(cacheKey, assetDetails);
      return assetDetails;

    } catch (error) {
      console.error('Error fetching asset details:', error);
      return null;
    }
  }

  /**
   * Get current price for an asset
   */
  async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const response = await axios.get(`${this.YAHOO_FINANCE_API}/quote`, {
        params: { symbols: symbol },
        timeout: 3000,
      });

      const quote = response.data.quoteResponse?.result?.[0];
      return quote?.regularMarketPrice || null;
    } catch (error) {
      console.error('Error fetching current price:', error);
      return null;
    }
  }

  /**
   * Validate if a symbol exists and is tradeable
   */
  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      const price = await this.getCurrentPrice(symbol);
      return price !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get popular/recommended assets
   */
  getPopularAssets(region?: 'AU' | 'US' | 'IN'): AssetSearchResult[] {
    if (region) {
      return this.popularAssets.filter(asset => asset.region === region);
    }
    return this.popularAssets;
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category: 'stocks' | 'etfs' | 'crypto' | 'bonds'): AssetSearchResult[] {
    const typeMap = {
      stocks: 'stock',
      etfs: 'etf',
      crypto: 'crypto',
      bonds: 'bond',
    };
    
    return this.popularAssets.filter(asset => asset.type === typeMap[category]);
  }

  private mapYahooTypeToAssetType(yahooType: string): AssetSearchResult['type'] {
    const typeMap: { [key: string]: AssetSearchResult['type'] } = {
      'EQUITY': 'stock',
      'ETF': 'etf',
      'MUTUALFUND': 'mutual-fund',
      'INDEX': 'index',
      'CRYPTOCURRENCY': 'crypto',
      'BOND': 'bond',
    };
    
    return typeMap[yahooType?.toUpperCase()] || 'stock';
  }

  private mapExchangeToRegion(exchange: string): AssetSearchResult['region'] {
    const exchangeMap: { [key: string]: AssetSearchResult['region'] } = {
      'ASX': 'AU',
      'NYSE': 'US',
      'NASDAQ': 'US',
      'NSE': 'IN',
      'BSE': 'IN',
      'CCC': 'GLOBAL', // Crypto
    };
    
    return exchangeMap[exchange] || 'GLOBAL';
  }

  // Debounced search for real-time search as user types
  debouncedSearch = debounce(this.searchAssets.bind(this), 300);
}

export const assetSearchService = new AssetSearchService();