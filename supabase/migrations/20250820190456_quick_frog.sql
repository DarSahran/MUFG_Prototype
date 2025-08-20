/*
  # Comprehensive Serper API Integration Schema

  1. New Tables
    - `subscription_plans` - Plan definitions with query limits
    - `user_subscriptions` - User plan assignments
    - `query_usage_tracking` - Real-time query usage tracking
    - `serper_query_logs` - Detailed query logs for analytics
    - `serper_cache` - Cache search results to reduce API calls

  2. Functions
    - `check_query_permission` - Check if user can make query
    - `increment_query_usage` - Safely increment usage counter
    - `get_user_plan_details` - Get comprehensive plan info
    - `reset_query_counts` - Reset counts based on billing cycle

  3. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
*/

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  monthly_query_limit integer NOT NULL DEFAULT 10,
  daily_query_limit integer NOT NULL DEFAULT 2,
  price_monthly numeric(10,2) DEFAULT 0,
  price_yearly numeric(10,2) DEFAULT 0,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('daily', 'weekly', 'monthly', 'yearly')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT (now() + interval '1 month'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create query usage tracking table
CREATE TABLE IF NOT EXISTS query_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  daily_count integer DEFAULT 0,
  monthly_count integer DEFAULT 0,
  last_daily_reset timestamptz DEFAULT date_trunc('day', now()),
  last_monthly_reset timestamptz DEFAULT date_trunc('month', now()),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create serper query logs table
CREATE TABLE IF NOT EXISTS serper_query_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query_text text NOT NULL,
  response_data jsonb,
  search_type text DEFAULT 'search' CHECK (search_type IN ('search', 'news', 'images')),
  tokens_used integer DEFAULT 0,
  response_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create serper cache table
CREATE TABLE IF NOT EXISTS serper_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  query_text text NOT NULL,
  search_type text NOT NULL,
  response_data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  hit_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default plans
INSERT INTO subscription_plans (name, description, monthly_query_limit, daily_query_limit, price_monthly, features) VALUES
  ('Free', 'Basic plan for getting started', 10, 2, 0, '["Basic AI chat", "Limited market data", "Email support"]'),
  ('Pro', 'Professional plan for active investors', 100, 10, 29, '["Unlimited AI chat", "Real-time market data", "Advanced analytics", "Priority support"]'),
  ('Family', 'Family plan for multiple users', 200, 20, 49, '["Everything in Pro", "Up to 4 family accounts", "Shared goals", "Family reporting"]'),
  ('Enterprise', 'Enterprise plan for institutions', 1000, 100, 199, '["Everything in Family", "API access", "Custom integrations", "Dedicated support"]')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE serper_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE serper_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Plans are publicly readable" ON subscription_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON user_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON query_usage_tracking FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can manage usage" ON query_usage_tracking FOR ALL TO service_role USING (true);

CREATE POLICY "Users can view own query logs" ON serper_query_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can manage query logs" ON serper_query_logs FOR ALL TO service_role USING (true);

CREATE POLICY "Cache is publicly readable" ON serper_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage cache" ON serper_cache FOR ALL TO service_role USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_query_usage_user_id ON query_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_serper_logs_user_id ON serper_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_serper_logs_created_at ON serper_query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_serper_cache_key ON serper_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_serper_cache_expires ON serper_cache(expires_at);

-- Function to check if user can make a query
CREATE OR REPLACE FUNCTION check_query_permission(p_user_id uuid)
RETURNS TABLE(
  can_query boolean,
  daily_remaining integer,
  monthly_remaining integer,
  plan_name text,
  next_reset timestamptz
) 
SECURITY DEFINER
AS $$
DECLARE
  v_subscription record;
  v_usage record;
  v_plan record;
  v_daily_remaining integer;
  v_monthly_remaining integer;
  v_next_reset timestamptz;
BEGIN
  -- Get user subscription and plan
  SELECT us.*, sp.name as plan_name, sp.monthly_query_limit, sp.daily_query_limit
  INTO v_subscription
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id AND us.status = 'active';
  
  -- If no subscription, assign free plan
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id, plan_id, billing_cycle, current_period_end)
    SELECT p_user_id, sp.id, 'monthly', now() + interval '1 month'
    FROM subscription_plans sp WHERE sp.name = 'Free'
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT us.*, sp.name as plan_name, sp.monthly_query_limit, sp.daily_query_limit
    INTO v_subscription
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id;
  END IF;
  
  -- Get or create usage tracking
  SELECT * INTO v_usage FROM query_usage_tracking WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO query_usage_tracking (user_id, plan_id)
    VALUES (p_user_id, v_subscription.plan_id);
    
    SELECT * INTO v_usage FROM query_usage_tracking WHERE user_id = p_user_id;
  END IF;
  
  -- Reset counts if needed
  IF v_usage.last_daily_reset < date_trunc('day', now()) THEN
    UPDATE query_usage_tracking 
    SET daily_count = 0, last_daily_reset = date_trunc('day', now())
    WHERE user_id = p_user_id;
    v_usage.daily_count := 0;
  END IF;
  
  IF v_usage.last_monthly_reset < date_trunc('month', now()) THEN
    UPDATE query_usage_tracking 
    SET monthly_count = 0, last_monthly_reset = date_trunc('month', now())
    WHERE user_id = p_user_id;
    v_usage.monthly_count := 0;
  END IF;
  
  -- Calculate remaining queries
  v_daily_remaining := GREATEST(0, v_subscription.daily_query_limit - v_usage.daily_count);
  v_monthly_remaining := GREATEST(0, v_subscription.monthly_query_limit - v_usage.monthly_count);
  
  -- Calculate next reset time
  v_next_reset := GREATEST(
    date_trunc('day', now()) + interval '1 day',
    date_trunc('month', now()) + interval '1 month'
  );
  
  RETURN QUERY SELECT 
    (v_daily_remaining > 0 AND v_monthly_remaining > 0) as can_query,
    v_daily_remaining,
    v_monthly_remaining,
    v_subscription.plan_name,
    v_next_reset;
END;
$$ LANGUAGE plpgsql;

-- Function to increment query usage
CREATE OR REPLACE FUNCTION increment_query_usage(p_user_id uuid)
RETURNS boolean
SECURITY DEFINER
AS $$
DECLARE
  v_can_query boolean;
BEGIN
  -- Check permission first
  SELECT can_query INTO v_can_query 
  FROM check_query_permission(p_user_id);
  
  IF NOT v_can_query THEN
    RETURN false;
  END IF;
  
  -- Increment counters
  UPDATE query_usage_tracking 
  SET 
    daily_count = daily_count + 1,
    monthly_count = monthly_count + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive user plan details
CREATE OR REPLACE FUNCTION get_user_plan_details(p_user_id uuid)
RETURNS TABLE(
  plan_name text,
  daily_limit integer,
  monthly_limit integer,
  daily_used integer,
  monthly_used integer,
  daily_remaining integer,
  monthly_remaining integer,
  can_query boolean,
  next_reset timestamptz,
  plan_features jsonb
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.plan_name,
    cp.daily_remaining as daily_limit,
    cp.monthly_remaining as monthly_limit,
    COALESCE(qut.daily_count, 0) as daily_used,
    COALESCE(qut.monthly_count, 0) as monthly_used,
    cp.daily_remaining,
    cp.monthly_remaining,
    cp.can_query,
    cp.next_reset,
    sp.features as plan_features
  FROM check_query_permission(p_user_id) cp
  LEFT JOIN query_usage_tracking qut ON qut.user_id = p_user_id
  LEFT JOIN user_subscriptions us ON us.user_id = p_user_id
  LEFT JOIN subscription_plans sp ON sp.id = us.plan_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_query_usage_tracking_updated_at BEFORE UPDATE ON query_usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_serper_cache_updated_at BEFORE UPDATE ON serper_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();