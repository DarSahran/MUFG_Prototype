import { useState, useEffect, useRef } from 'react';
import { marketDataAggregator } from '../services/marketData/MarketDataAggregator';
import { MarketDataPoint } from '../types/portfolioTypes';

interface UseRealTimeDataOptions {
  symbols: string[];
  interval?: number;
  enabled?: boolean;
  assetTypes?: { [symbol: string]: string };
  regions?: { [symbol: string]: string };
}

export const useRealTimeData = ({
  symbols,
  interval = 30000, // 30 seconds
  enabled = true,
  assetTypes = {},
  regions = {},
}: UseRealTimeDataOptions) => {
  const [prices, setPrices] = useState<{ [symbol: string]: MarketDataPoint }>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    // Try WebSocket connection first, fallback to polling
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (wsUrl) {
      connectWebSocket(wsUrl);
    } else {
      startPolling();
    }

    return () => {
      cleanup();
    };
  }, [symbols, interval, enabled]);

  const connectWebSocket = (wsUrl: string) => {
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for real-time data');
        // Subscribe to symbols
        ws.send(JSON.stringify({
          action: 'subscribe',
          symbols,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'price_update') {
            setPrices(prev => ({
              ...prev,
              [data.symbol]: data,
            }));
            setLastUpdate(new Date());
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection failed');
        // Fallback to polling
        startPolling();
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (enabled) {
            connectWebSocket(wsUrl);
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      startPolling();
    }
  };

  const startPolling = () => {
    const fetchPrices = async () => {
      if (!enabled) return;

      setLoading(true);
      setError(null);

      try {
        const pricePromises = symbols.map(async (symbol) => {
          const assetType = assetTypes[symbol] || 'stock';
          const region = regions[symbol] || 'AU';
          
          const data = await marketDataAggregator.getAssetPrice(symbol, assetType, region);
          return { symbol, data };
        });

        const results = await Promise.all(pricePromises);
        const newPrices: { [symbol: string]: MarketDataPoint } = {};

        results.forEach(({ symbol, data }) => {
          if (data) {
            newPrices[symbol] = data;
          }
        });

        setPrices(prev => ({ ...prev, ...newPrices }));
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching real-time prices:', error);
        setError('Failed to fetch price data');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPrices();

    // Set up polling interval
    intervalRef.current = setInterval(fetchPrices, interval);
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const refreshPrices = async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Request refresh via WebSocket
      wsRef.current.send(JSON.stringify({
        action: 'refresh',
        symbols,
      }));
    } else {
      // Manual refresh via API
      setLoading(true);
      try {
        const pricePromises = symbols.map(async (symbol) => {
          const assetType = assetTypes[symbol] || 'stock';
          const region = regions[symbol] || 'AU';
          
          const data = await marketDataAggregator.getAssetPrice(symbol, assetType, region);
          return { symbol, data };
        });

        const results = await Promise.all(pricePromises);
        const newPrices: { [symbol: string]: MarketDataPoint } = {};

        results.forEach(({ symbol, data }) => {
          if (data) {
            newPrices[symbol] = data;
          }
        });

        setPrices(prev => ({ ...prev, ...newPrices }));
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error refreshing prices:', error);
        setError('Failed to refresh price data');
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    prices,
    lastUpdate,
    loading,
    error,
    refreshPrices,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};