interface StockQuoteResponse {
  source: 'live' | 'fallback';
  symbol: string;
  currency: string;
  regularMarketPrice: number;
  open: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  error?: string;
  note?: string;
}

class CustomBackendAPI {
  private baseUrl = 'https://mufg-hackathon-backend-q8zxhtuu6-darsahrans-projects.vercel.app';
  private cache = new Map<string, { data: StockQuoteResponse; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async getStockQuote(symbol: string): Promise<StockQuoteResponse | null> {
    const cacheKey = `quote_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${this.baseUrl}/api/quote?symbol=${encodeURIComponent(symbol)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: StockQuoteResponse = await response.json();
      
      // Cache the response
      this.setCachedData(cacheKey, data);
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Error fetching quote for ${symbol}:`, error);
      
      // Return fallback data structure
      return {
        source: 'fallback',
        symbol,
        currency: 'USD',
        regularMarketPrice: 100.0,
        open: 100.1,
        previousClose: 99.5,
        dayHigh: 101.0,
        dayLow: 99.0,
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'This is mock data due to API error.'
      };
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<{ [symbol: string]: StockQuoteResponse }> {
    const results: { [symbol: string]: StockQuoteResponse } = {};
    
    // Fetch quotes in parallel with error handling
    const promises = symbols.map(async (symbol) => {
      try {
        const quote = await this.getStockQuote(symbol);
        if (quote) {
          results[symbol] = quote;
        }
      } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  private getCachedData(key: string): StockQuoteResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: StockQuoteResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Convert backend response to our internal format
  convertToMarketDataPoint(quote: StockQuoteResponse): any {
    return {
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketPrice - quote.previousClose,
      changePercent: ((quote.regularMarketPrice - quote.previousClose) / quote.previousClose) * 100,
      volume: 0, // Not provided by backend
      timestamp: new Date().toISOString(),
      source: quote.source,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      open: quote.open,
      previousClose: quote.previousClose,
    };
  }
}

export const customBackendAPI = new CustomBackendAPI();