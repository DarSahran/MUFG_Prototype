import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { customBackendAPI } from '../services/customBackendAPI';

interface AIQuery {
  query: string;
  context?: {
    portfolioValue?: number;
    riskProfile?: string;
    age?: number;
    retirementAge?: number;
  };
}

interface AIResponse {
  answer: string;
  marketAnalysis: string;
  recommendations: string[];
  riskAssessment: string;
  sources: string[];
  confidence: number;
  queryType: string;
}

interface UsageInfo {
  currentCalls: number;
  limit: number;
  remaining: number;
  planName: string;
  resetDate: string;
  resetPeriod: 'weekly' | 'monthly';
  daysUntilReset: number;
}

export const useAIAdvisor = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);

  const askAI = useCallback(async (queryData: AIQuery): Promise<AIResponse | null> => {
    if (!user) {
      setError('Please log in to use the AI advisor');
      return null;
    }

    // Check if user can make request based on plan limits
    const canMakeRequest = await checkRequestPermission();
    if (!canMakeRequest) {
      setError('Request limit exceeded for your plan. Please upgrade or wait for reset.');
      return null;
    }

    setLoading(true);
    setError(null);
    setLastRequestTime(Date.now());

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(queryData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(result.message || 'Request limit exceeded. Please upgrade your plan or wait for reset.');
          return null;
        }
        throw new Error(result.error || 'Failed to get AI response');
      }

      // Update usage info after successful query
      await fetchUsageInfo();

      return result as AIResponse;
    } catch (err: any) {
      console.error('AI Advisor error:', err);
      setError(err.message || 'Failed to get AI response');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkRequestPermission = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      await fetchUsageInfo();
      
      if (!usageInfo) return false;
      
      // Check if user has remaining requests
      if (usageInfo.remaining <= 0) {
        return false;
      }
      
      // Check rate limiting (prevent spam)
      const timeSinceLastRequest = Date.now() - lastRequestTime;
      const minInterval = 2000; // 2 seconds between requests
      
      if (timeSinceLastRequest < minInterval) {
        setError('Please wait a moment before making another request.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking request permission:', error);
      return false;
    }
  }, [user, usageInfo, lastRequestTime]);

  const fetchUsageInfo = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      // Use the database function to get comprehensive plan info
      const { data, error } = await supabase.rpc('get_user_plan_info', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching usage info:', error);
        return;
      }

      if (data) {
        const resetDate = new Date(data.billing_period_end);
        const now = new Date();
        const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine reset period based on plan
        const resetPeriod = data.plan_name === 'Free' ? 'weekly' : 'monthly';
        
        setUsageInfo({
          currentCalls: data.current_calls,
          limit: data.api_call_limit,
          remaining: Math.max(0, data.remaining_calls),
          planName: data.plan_name,
          resetDate: data.billing_period_end,
          resetPeriod,
          daysUntilReset: Math.max(0, daysUntilReset),
        });
      }
    } catch (err) {
      console.error('Error fetching usage info:', err);
    }
  }, [user]);

  const refreshUsageInfo = useCallback(async () => {
    await fetchUsageInfo();
  }, [fetchUsageInfo]);

  const getRemainingTime = useCallback((): string => {
    if (!usageInfo) return '';
    
    if (usageInfo.resetPeriod === 'weekly') {
      return usageInfo.daysUntilReset <= 1 ? 'Resets tomorrow' : `Resets in ${usageInfo.daysUntilReset} days`;
    } else {
      return usageInfo.daysUntilReset <= 1 ? 'Resets tomorrow' : `Resets in ${usageInfo.daysUntilReset} days`;
    }
  }, [usageInfo]);

  const canMakeRequest = useCallback((): boolean => {
    if (!usageInfo) return false;
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    return usageInfo.remaining > 0 && timeSinceLastRequest >= 2000;
  }, [usageInfo, lastRequestTime]);

  const getConversationHistory = useCallback(async (limit: number = 10) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching conversation history:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching conversation history:', err);
      return [];
    }
  }, [user]);

  return {
    askAI,
    loading,
    error,
    usageInfo,
    fetchUsageInfo,
    refreshUsageInfo,
    getRemainingTime,
    canMakeRequest,
    getConversationHistory,
  };
};