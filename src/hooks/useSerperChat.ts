import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface SerperChatQuery {
  query: string;
  context?: {
    portfolioValue?: number;
    riskProfile?: string;
    age?: number;
    retirementAge?: number;
  };
  searchType?: 'search' | 'news' | 'images';
}

interface SerperChatResponse {
  answer: string;
  searchResults: any[];
  sources: string[];
  confidence: number;
  queryType: string;
  tokensUsed: number;
  cached: boolean;
}

interface PlanDetails {
  planName: string;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  canQuery: boolean;
  nextReset: string;
  planFeatures: string[];
}

export const useSerperChat = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);

  const askSerperAI = useCallback(async (queryData: SerperChatQuery): Promise<SerperChatResponse | null> => {
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serper-ai-chat`, {
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
          setError(result.message || 'Query limit exceeded. Please upgrade your plan or wait for reset.');
          return null;
        }
        throw new Error(result.error || 'Failed to get AI response');
      }

      // Update plan details after successful query
      await fetchPlanDetails();

      return result as SerperChatResponse;
    } catch (err: any) {
      console.error('Serper AI error:', err);
      setError(err.message || 'Failed to get AI response');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPlanDetails = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_plan_details', { p_user_id: user.id })
        .single();

      if (error) {
        console.error('Error fetching plan details:', error);
        return;
      }

      if (data) {
        setPlanDetails({
          planName: data.plan_name,
          dailyLimit: data.daily_limit,
          monthlyLimit: data.monthly_limit,
          dailyUsed: data.daily_used,
          monthlyUsed: data.monthly_used,
          dailyRemaining: data.daily_remaining,
          monthlyRemaining: data.monthly_remaining,
          canQuery: data.can_query,
          nextReset: data.next_reset,
          planFeatures: data.plan_features || [],
        });
      }
    } catch (err) {
      console.error('Error fetching plan details:', err);
    }
  }, [user]);

  const canMakeQuery = useCallback((): boolean => {
    if (!planDetails) return false;
    return planDetails.canQuery && planDetails.dailyRemaining > 0 && planDetails.monthlyRemaining > 0;
  }, [planDetails]);

  const getUsageMessage = useCallback((): string => {
    if (!planDetails) return '';
    
    if (!planDetails.canQuery) {
      return `You've reached your ${planDetails.planName} plan limits. Daily: ${planDetails.dailyRemaining}/${planDetails.dailyLimit}, Monthly: ${planDetails.monthlyRemaining}/${planDetails.monthlyLimit}`;
    }
    
    if (planDetails.dailyRemaining <= 1) {
      return `Only ${planDetails.dailyRemaining} daily queries remaining. Resets tomorrow.`;
    }
    
    if (planDetails.monthlyRemaining <= 5) {
      return `Only ${planDetails.monthlyRemaining} monthly queries remaining. Consider upgrading your plan.`;
    }
    
    return '';
  }, [planDetails]);

  const getTimeUntilReset = useCallback((): string => {
    if (!planDetails) return '';
    
    const resetDate = new Date(planDetails.nextReset);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) {
      return `Resets in ${diffHours} hours`;
    } else {
      return `Resets in ${diffDays} days`;
    }
  }, [planDetails]);

  return {
    askSerperAI,
    loading,
    error,
    setError,
    planDetails,
    fetchPlanDetails,
    canMakeQuery,
    getUsageMessage,
    getTimeUntilReset,
  };
};