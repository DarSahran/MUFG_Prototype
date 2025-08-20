import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface MarketDataPoint {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  source: string;
}

interface MarketSubscription {
  symbols: string[];
  onUpdate: (data: MarketDataPoint) => void;
  enabled: boolean;
}

export const useRealTimeMarket = () => {
  const { user } = useAuth();
  const [marketData, setMarketData] = useState<{ [symbol: string]: MarketDataPoint }>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [subscriptions, setSubscriptions] = useState<MarketSubscription[]>([]);
  const [hasRealtimeAccess, setHasRealtimeAccess] = useState(false);

  useEffect(() => {
    if (user) {
      checkRealtimeAccess();
    }
  }, [user]);

  useEffect(() => {
    if (hasRealtimeAccess && subscriptions.length > 0) {
      setupRealtimeConnection();
    }
    
    return () => {
      // Cleanup connections
      supabase.removeAllChannels();
    };
  }, [hasRealtimeAccess, subscriptions]);

  const checkRealtimeAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          plans!inner(realtime_access)
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking realtime access:', error);
        return;
      }

      const plan = data.plans as any;
      setHasRealtimeAccess(plan.realtime_access || false);
    } catch (err) {
      console.error('Error checking realtime access:', err);
    }
  };

  const setupRealtimeConnection = () => {
    setConnectionStatus('connecting');

    const channel = supabase
      .channel('market-data-updates')
      .on('broadcast', { event: 'price-update' }, (payload) => {
        const update = payload.payload as MarketDataPoint;
        
        setMarketData(prev => ({
          ...prev,
          [update.symbol]: update
        }));

        // Notify subscribers
        subscriptions.forEach(sub => {
          if (sub.enabled && sub.symbols.includes(update.symbol)) {
            sub.onUpdate(update);
          }
        });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'price_history'
      }, (payload) => {
        const newData = payload.new as any;
        const marketPoint: MarketDataPoint = {
          symbol: newData.symbol,
          price: Number(newData.price),
          change: 0, // Would calculate from previous
          changePercent: Number(newData.change_percent) || 0,
          volume: Number(newData.volume) || 0,
          timestamp: newData.timestamp,
          source: newData.source || 'database'
        };

        setMarketData(prev => ({
          ...prev,
          [marketPoint.symbol]: marketPoint
        }));

        // Notify subscribers
        subscriptions.forEach(sub => {
          if (sub.enabled && sub.symbols.includes(marketPoint.symbol)) {
            sub.onUpdate(marketPoint);
          }
        });
      })
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribe = useCallback((symbols: string[], onUpdate: (data: MarketDataPoint) => void): () => void => {
    if (!hasRealtimeAccess) {
      console.warn('Realtime access not available for current plan');
      return () => {};
    }

    const subscription: MarketSubscription = {
      symbols,
      onUpdate,
      enabled: true
    };

    setSubscriptions(prev => [...prev, subscription]);

    // Return unsubscribe function
    return () => {
      setSubscriptions(prev => prev.filter(sub => sub !== subscription));
    };
  }, [hasRealtimeAccess]);

  const getLatestPrice = useCallback(async (symbol: string): Promise<MarketDataPoint | null> => {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        symbol: data.symbol,
        price: Number(data.price),
        change: 0,
        changePercent: Number(data.change_percent) || 0,
        volume: Number(data.volume) || 0,
        timestamp: data.timestamp,
        source: data.source || 'database'
      };
    } catch (err) {
      console.error('Error fetching latest price:', err);
      return null;
    }
  }, []);

  const triggerMarketDataSync = useCallback(async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-data-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
    } catch (err) {
      console.error('Error triggering market data sync:', err);
    }
  }, []);

  return {
    marketData,
    connectionStatus,
    hasRealtimeAccess,
    subscribe,
    getLatestPrice,
    triggerMarketDataSync,
  };
};