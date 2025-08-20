import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

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
}

export const useAIAdvisor = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);

  const askAI = useCallback(async (queryData: AIQuery): Promise<AIResponse | null> => {
    if (!user) {
      setError('Please log in to use the AI advisor');
      return null;
    }

    setLoading(true);
    setError(null);

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
          setError(result.message || 'API limit exceeded. Please upgrade your plan.');
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

  const fetchUsageInfo = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select(`
          current_calls,
          billing_period_end,
          plans!inner(name, api_call_limit)
        `)
        .eq('user_id', user.id)
        .gte('billing_period_end', new Date().toISOString())
        .single();

      if (error) {
        console.error('Error fetching usage info:', error);
        return;
      }

      if (data) {
        const plan = data.plans as any;
        setUsageInfo({
          currentCalls: data.current_calls,
          limit: plan.api_call_limit,
          remaining: Math.max(0, plan.api_call_limit - data.current_calls),
          planName: plan.name,
          resetDate: data.billing_period_end,
        });
      }
    } catch (err) {
      console.error('Error fetching usage info:', err);
    }
  }, [user]);

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
    getConversationHistory,
  };
};