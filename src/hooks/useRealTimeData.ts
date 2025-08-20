import { useState, useEffect, useRef } from 'react';
import { customBackendAPI } from '../services/customBackendAPI';

interface RealTimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  source: string;
  dayHigh?: number;
  dayLow?: number;
  open?: number;
  previousClose?: number;
}

interface UseRealTimeDataOptions {
  symbols: string[];
  interval?: number; // in milliseconds
  enabled?: boolean;
  assetTypes?: { [symbol: string]: string };
  regions?: { [symbol: string]: string };
  planLimits?: {
    maxRequests: number;
    resetPeriod: 'weekly' | 'monthly';
  };
}

export const useRealTimeData = ({
  symbols,
  interval = 30000, // 30 seconds
  enabled = true,
  assetTypes = {},
  regions = {},
  planLimits = { maxRequests: 10, resetPeriod: 'weekly' },
}: UseRealTimeDataOptions) => {
  const [prices, setPrices] = useState<{ [symbol: string]: RealTimePrice }>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [requestCount, setRequestCount] = useState(0);
  const [lastResetTime, setLastResetTime] = useState<Date>(new Date());
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestTimestamps = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    startRealTimeUpdates();

    return () => {
      cleanup();
    };
  }, [symbols, interval, enabled, planLimits]);

  const startRealTimeUpdates = async () => {
    setConnectionStatus('connecting');
    setLoading(true);
    setError(null);
    
    try {
      // Initial price fetch
      await fetchPricesFromBackend();
      
      // Set up interval for updates
      intervalRef.current = setInterval(() => {
        if (canMakeRequest()) {
          fetchPricesFromBackend();
        }
      }, interval);
      
      setLastUpdate(new Date());
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error starting real-time updates:', error);
      setError('Failed to connect to market data');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricesFromBackend = async () => {
    try {
      const quotes = await customBackendAPI.getMultipleQuotes(symbols);
      const convertedPrices: { [symbol: string]: RealTimePrice } = {};
      
      Object.entries(quotes).forEach(([symbol, quote]) => {
        convertedPrices[symbol] = {
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
      });
      
      setPrices(prev => ({ ...prev, ...convertedPrices }));
      setLastUpdate(new Date());
      
      // Track request
      recordRequest();
      
    } catch (error) {
      console.error('Error fetching prices from backend:', error);
      setError('Failed to fetch market data');
    }
  };

  const canMakeRequest = (): boolean => {
    // Clean old timestamps
    const now = Date.now();
    const resetPeriodMs = planLimits.resetPeriod === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    
    requestTimestamps.current = requestTimestamps.current.filter(
      timestamp => now - timestamp < resetPeriodMs
    );
    
    return requestTimestamps.current.length < planLimits.maxRequests;
  };

  const recordRequest = () => {
    requestTimestamps.current.push(Date.now());
    setRequestCount(requestTimestamps.current.length);
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  const refreshPrices = async () => {
    if (!canMakeRequest()) {
      setError(`Request limit reached. You can make ${planLimits.maxRequests} requests per ${planLimits.resetPeriod}.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await fetchPricesFromBackend();
    } catch (error) {
      console.error('Error refreshing prices:', error);
      setError('Failed to refresh price data');
    } finally {
      setLoading(false);
    }
  };

  return {
    prices,
    lastUpdate,
    loading,
    error,
    connectionStatus,
    refreshPrices,
    requestCount,
    maxRequests: planLimits.maxRequests,
    canMakeRequest: canMakeRequest(),
    isConnected: connectionStatus === 'connected',
  };
};