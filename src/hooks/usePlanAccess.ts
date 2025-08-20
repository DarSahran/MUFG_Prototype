import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface PlanFeatures {
  apiCallLimit: number;
  realtimeAccess: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  features: string[];
}

interface UserPlan {
  id: string;
  name: string;
  description: string;
  features: PlanFeatures;
  currentUsage: number;
  remaining: number;
  resetDate: string;
}

export const usePlanAccess = () => {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    } else {
      setUserPlan(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserPlan = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's plan and current usage
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          plan_id,
          plans!inner(
            id,
            name,
            description,
            api_call_limit,
            realtime_access,
            advanced_analytics,
            priority_support,
            features
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get current usage
      const { data: usage, error: usageError } = await supabase
        .from('api_usage_tracking')
        .select('current_calls, billing_period_end')
        .eq('user_id', user.id)
        .gte('billing_period_end', new Date().toISOString())
        .single();

      if (usageError && usageError.code !== 'PGRST116') { // Ignore "no rows" error
        console.warn('Usage tracking error:', usageError);
      }

      const plan = profile.plans as any;
      const currentUsage = usage?.current_calls || 0;

      setUserPlan({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        features: {
          apiCallLimit: plan.api_call_limit,
          realtimeAccess: plan.realtime_access,
          advancedAnalytics: plan.advanced_analytics,
          prioritySupport: plan.priority_support,
          features: plan.features || [],
        },
        currentUsage,
        remaining: Math.max(0, plan.api_call_limit - currentUsage),
        resetDate: usage?.billing_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFeatureAccess = (feature: keyof PlanFeatures): boolean => {
    if (!userPlan) return false;
    return userPlan.features[feature] as boolean;
  };

  const canMakeAPICall = (): boolean => {
    if (!userPlan) return false;
    return userPlan.remaining > 0;
  };

  const getUpgradeMessage = (): string => {
    if (!userPlan) return 'Please log in to access features';
    
    if (userPlan.remaining === 0) {
      return `You've reached your ${userPlan.name} plan limit of ${userPlan.features.apiCallLimit} AI queries this month. Upgrade for more queries.`;
    }
    
    if (userPlan.remaining <= 5) {
      return `Only ${userPlan.remaining} AI queries remaining this month. Consider upgrading your plan.`;
    }
    
    return '';
  };

  const getDaysUntilReset = (): number => {
    if (!userPlan) return 0;
    const resetDate = new Date(userPlan.resetDate);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return {
    userPlan,
    loading,
    error,
    checkFeatureAccess,
    canMakeAPICall,
    getUpgradeMessage,
    getDaysUntilReset,
    refetch: fetchUserPlan,
  };
};