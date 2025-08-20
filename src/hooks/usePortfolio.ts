import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { AssetHolding } from '../types/portfolio';
import { customBackendAPI } from '../services/customBackendAPI';

interface UserGoal {
  id: string;
  goal_type: string;
  title: string;
  description?: string;
  target_amount: number;
  target_date?: string;
  current_amount: number;
  priority: number;
  is_active: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency_display: 'symbol' | 'code' | 'name';
  date_format: string;
  number_format: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard_layout: {
    cards: string[];
  };
  privacy_settings: {
    profile_public: boolean;
    share_analytics: boolean;
  };
}

export const usePortfolio = () => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<AssetHolding[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshPortfolio = async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    
    setRefreshing(true);
    try {
      // Update asset prices from custom backend
      await updateAssetPrices();
      
      // Refetch portfolio data
      await fetchPortfolioData();
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    } else {
      setHoldings([]);
      setGoals([]);
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPortfolioData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch holdings, goals, and preferences in parallel
      const [holdingsResult, goalsResult, preferencesResult] = await Promise.all([
        supabase
          .from('user_holdings')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('priority', { ascending: true }),
        
        supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (holdingsResult.error) throw holdingsResult.error;
      if (goalsResult.error) throw goalsResult.error;
      if (preferencesResult.error) throw preferencesResult.error;

      // Transform holdings data to match AssetHolding interface
      const transformedHoldings: AssetHolding[] = holdingsResult.data.map(holding => ({
        id: holding.id,
        type: holding.asset_type as AssetHolding['type'],
        symbol: holding.symbol,
        name: holding.name,
        quantity: Number(holding.quantity),
        purchasePrice: Number(holding.purchase_price),
        currentPrice: Number(holding.current_price),
        currency: holding.currency as AssetHolding['currency'],
        exchange: holding.exchange,
        purchaseDate: holding.purchase_date,
        region: holding.region as AssetHolding['region'],
        metadata: holding.metadata,
      }));

      setHoldings(transformedHoldings);
      setGoals(goalsResult.data);
      setPreferences(preferencesResult.data);

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addHolding = async (holding: Omit<AssetHolding, 'id'>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('user_holdings')
        .insert({
          user_id: user.id,
          asset_type: holding.type,
          symbol: holding.symbol,
          name: holding.name,
          quantity: holding.quantity,
          purchase_price: holding.purchasePrice,
          current_price: holding.currentPrice,
          currency: holding.currency,
          exchange: holding.exchange,
          region: holding.region,
          purchase_date: holding.purchaseDate,
          metadata: holding.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      // Transform and add to local state
      const newHolding: AssetHolding = {
        id: data.id,
        type: data.asset_type,
        symbol: data.symbol,
        name: data.name,
        quantity: Number(data.quantity),
        purchasePrice: Number(data.purchase_price),
        currentPrice: Number(data.current_price),
        currency: data.currency,
        exchange: data.exchange,
        purchaseDate: data.purchase_date,
        region: data.region,
        metadata: data.metadata,
      };

      setHoldings(prev => [newHolding, ...prev]);
      return { data: newHolding, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateHolding = async (id: string, updates: Partial<AssetHolding>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const dbUpdates: any = {};
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.currentPrice !== undefined) dbUpdates.current_price = updates.currentPrice;
      if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;

      const { data, error } = await supabase
        .from('user_holdings')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setHoldings(prev => prev.map(holding => 
        holding.id === id 
          ? { ...holding, ...updates }
          : holding
      ));

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteHolding = async (id: string) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { error } = await supabase
        .from('user_holdings')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setHoldings(prev => prev.filter(holding => holding.id !== id));
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const addGoal = async (goal: Omit<UserGoal, 'id'>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          ...goal,
        })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [...prev, data].sort((a, b) => a.priority - b.priority));
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences,
        })
        .select()
        .single();

      if (error) throw error;

      setPreferences(data);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateAssetPrices = async () => {
    if (!user || holdings.length === 0) return;

    try {
      // Get symbols that have them
      const symbolHoldings = holdings.filter(h => h.symbol);
      const symbols = symbolHoldings.map(h => h.symbol!);
      
      if (symbols.length === 0) return;
      
      // Fetch latest prices from custom backend
      const quotes = await customBackendAPI.getMultipleQuotes(symbols);
      
      // Update holdings with new prices
      const updatePromises = symbolHoldings.map(async (holding) => {
        const quote = quotes[holding.symbol!];
        if (quote && quote.regularMarketPrice > 0) {
          return updateHolding(holding.id, { 
            currentPrice: quote.regularMarketPrice 
          });
        }
      });
      
      await Promise.allSettled(updatePromises);
      
    } catch (error) {
      console.error('Error updating asset prices:', error);
    }
  };

  const getTotalPortfolioValue = () => {
    try {
      return holdings.reduce((total, holding) => {
        const value = holding.quantity * holding.currentPrice;
        return total + (isNaN(value) ? 0 : value);
      }, 0);
    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      return 0;
    }
  };

  const getAssetAllocation = () => {
    const total = getTotalPortfolioValue();
    if (total === 0) return {};

    const allocation: { [key: string]: number } = {};
    holdings.forEach(holding => {
      const value = holding.quantity * holding.currentPrice;
      const percentage = (value / total) * 100;
      allocation[holding.type] = (allocation[holding.type] || 0) + percentage;
    });

    return allocation;
  };

  return {
    holdings,
    goals,
    preferences,
    loading,
    error,
    refreshing,
    addHolding,
    updateHolding,
    deleteHolding,
    addGoal,
    updatePreferences,
    getTotalPortfolioValue,
    getAssetAllocation,
    updateAssetPrices,
    handleRefreshPortfolio,
    refetch: fetchPortfolioData,
  };
};