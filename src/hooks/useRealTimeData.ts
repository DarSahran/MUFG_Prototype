import { useState, useEffect, useRef } from 'react';
import { realTimeMarketDataService, RealTimePrice } from '../services/realTimeMarketData';

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
  const [prices, setPrices] = useState<{ [symbol: string]: RealTimePrice }>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  const unsubscribeFunctions = useRef<{ [symbol: string]: () => void }>({});

  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    setConnectionStatus('connecting');
    subscribeToSymbols();

    return () => {
      cleanup();
    };
  }, [symbols, interval, enabled]);

  const subscribeToSymbols = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Subscribe to each symbol
      symbols.forEach(symbol => {
        const assetType = assetTypes[symbol] || 'stock';
        
        const unsubscribe = realTimeMarketDataService.subscribe(symbol, (priceData) => {
          setPrices(prev => ({
            ...prev,
            [symbol]: priceData,
          }));
          setLastUpdate(new Date());
        });
        
        unsubscribeFunctions.current[symbol] = unsubscribe;
      });
      
      // Initial price fetch
      const initialPrices = await realTimeMarketDataService.getMultiplePrices(symbols, assetTypes);
      setPrices(initialPrices);
      setLastUpdate(new Date());
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error subscribing to price updates:', error);
      setError('Failed to connect to market data');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const cleanup = () => {
    // Unsubscribe from all symbols
    Object.values(unsubscribeFunctions.current).forEach(unsubscribe => {
      unsubscribe();
    });
    unsubscribeFunctions.current = {};
    setConnectionStatus('disconnected');
  };

  const refreshPrices = async () => {
    setLoading(true);
    try {
      const refreshedPrices = await realTimeMarketDataService.getMultiplePrices(symbols, assetTypes);
      setPrices(prev => ({ ...prev, ...refreshedPrices }));
      setLastUpdate(new Date());
      setError(null);
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
    isConnected: connectionStatus === 'connected',
  };
};