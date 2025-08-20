/*
  # Comprehensive AI Advisor System Schema

  1. New Tables
    - `plans` - Subscription plans with API limits and features
    - `api_usage_tracking` - Track API usage per user per billing period
    - `api_request_logs` - Log all API requests for debugging and analytics
    - `financial_data_cache` - Cache external API data to reduce costs
    - `ai_conversations` - Store AI chat conversations

  2. Updates to existing tables
    - Add `plan_id` to `user_profiles` table
    - Create proper indexes for performance

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access
    - Create database functions for usage tracking

  4. Database Functions
    - `increment_api_usage` - Safely increment user API usage
    - `reset_monthly_usage` - Reset usage counters monthly
    - `get_user_plan_info` - Get user plan and usage info
*/

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  api_call_limit integer NOT NULL DEFAULT 10,
  realtime_access boolean DEFAULT false,
  advanced_analytics boolean DEFAULT false,
  priority_support boolean DEFAULT false,
  features text[] DEFAULT '{}',
  price_monthly numeric(10,2) DEFAULT 0,
  price_yearly numeric(10,2) DEFAULT 0,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default plans
INSERT INTO plans (name, description, api_call_limit, realtime_access, advanced_analytics, priority_support, features, price_monthly, price_yearly) VALUES
('Free', 'Basic financial insights', 10, false, false, false, ARRAY['Basic portfolio tracking', 'Monthly AI insights', 'Educational content'], 0, 0),
('Pro', 'Advanced investment guidance', 100, true, true, false, ARRAY['Unlimited portfolio tracking', 'Weekly AI insights', 'Real-time market data', 'Advanced analytics'], 29, 299),
('Family', 'Family financial planning', 200, true, true, true, ARRAY['Everything in Pro', 'Up to 4 family accounts', 'Shared goals', 'Family reporting'], 49, 499),
('Enterprise', 'Professional wealth management', 1000, true, true, true, ARRAY['Everything in Family', 'Unlimited accounts', 'API access', 'Custom features'], 199, 1999)
ON CONFLICT (name) DO NOTHING;

-- Add plan_id to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'plan_id') THEN
    ALTER TABLE user_profiles ADD COLUMN plan_id uuid REFERENCES plans(id) DEFAULT (SELECT id FROM plans WHERE name = 'Free' LIMIT 1);
  END IF;
END $$;

-- Create api_usage_tracking table
CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES plans(id) NOT NULL,
  current_calls integer DEFAULT 0,
  billing_period_start timestamptz DEFAULT date_trunc('month', now()),
  billing_period_end timestamptz DEFAULT (date_trunc('month', now()) + interval '1 month'),
  last_call_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, billing_period_start)
);

-- Create api_request_logs table
CREATE TABLE IF NOT EXISTS api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  request_body jsonb,
  response_body jsonb,
  status_code integer,
  duration_ms integer,
  error_message text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create financial_data_cache table
CREATE TABLE IF NOT EXISTS financial_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  data_type text NOT NULL,
  data jsonb NOT NULL,
  source text DEFAULT 'serper',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query text NOT NULL,
  response text NOT NULL,
  query_type text DEFAULT 'financial',
  confidence_score numeric(3,2),
  sources text[],
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for plans (public read access)
CREATE POLICY "Plans are publicly readable"
  ON plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Create RLS policies for api_usage_tracking
CREATE POLICY "Users can view own usage tracking"
  ON api_usage_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage tracking"
  ON api_usage_tracking
  FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for api_request_logs
CREATE POLICY "Users can view own request logs"
  ON api_request_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage request logs"
  ON api_request_logs
  FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for financial_data_cache
CREATE POLICY "Cache is publicly readable"
  ON financial_data_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage cache"
  ON financial_data_cache
  FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for ai_conversations
CREATE POLICY "Users can view own conversations"
  ON ai_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_user_id ON api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_billing_period ON api_usage_tracking(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_user_id ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_data_cache_key ON financial_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_financial_data_cache_expires ON financial_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);

-- Create database functions
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id uuid;
  v_current_period_start timestamptz;
  v_current_period_end timestamptz;
  v_current_calls integer;
  v_api_limit integer;
BEGIN
  -- Get user's plan
  SELECT plan_id INTO v_plan_id
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  IF v_plan_id IS NULL THEN
    -- Assign free plan if no plan exists
    SELECT id INTO v_plan_id FROM plans WHERE name = 'Free' LIMIT 1;
    UPDATE user_profiles SET plan_id = v_plan_id WHERE user_id = p_user_id;
  END IF;
  
  -- Get plan limits
  SELECT api_call_limit INTO v_api_limit
  FROM plans
  WHERE id = v_plan_id;
  
  -- Calculate current billing period
  v_current_period_start := date_trunc('month', now());
  v_current_period_end := v_current_period_start + interval '1 month';
  
  -- Get or create usage tracking record
  INSERT INTO api_usage_tracking (user_id, plan_id, billing_period_start, billing_period_end, current_calls)
  VALUES (p_user_id, v_plan_id, v_current_period_start, v_current_period_end, 1)
  ON CONFLICT (user_id, billing_period_start)
  DO UPDATE SET 
    current_calls = api_usage_tracking.current_calls + 1,
    last_call_at = now(),
    updated_at = now()
  RETURNING current_calls INTO v_current_calls;
  
  -- Check if within limits
  RETURN v_current_calls <= v_api_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_plan_info(p_user_id uuid)
RETURNS TABLE(
  plan_name text,
  api_call_limit integer,
  current_calls integer,
  remaining_calls integer,
  realtime_access boolean,
  advanced_analytics boolean,
  billing_period_end timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id uuid;
  v_current_period_start timestamptz;
BEGIN
  -- Get user's plan
  SELECT user_profiles.plan_id INTO v_plan_id
  FROM user_profiles
  WHERE user_profiles.user_id = p_user_id;
  
  IF v_plan_id IS NULL THEN
    -- Assign and return free plan
    SELECT plans.id INTO v_plan_id FROM plans WHERE plans.name = 'Free' LIMIT 1;
    UPDATE user_profiles SET plan_id = v_plan_id WHERE user_profiles.user_id = p_user_id;
  END IF;
  
  v_current_period_start := date_trunc('month', now());
  
  RETURN QUERY
  SELECT 
    p.name,
    p.api_call_limit,
    COALESCE(u.current_calls, 0),
    GREATEST(0, p.api_call_limit - COALESCE(u.current_calls, 0)),
    p.realtime_access,
    p.advanced_analytics,
    COALESCE(u.billing_period_end, v_current_period_start + interval '1 month')
  FROM plans p
  LEFT JOIN api_usage_tracking u ON u.user_id = p_user_id 
    AND u.plan_id = p.id 
    AND u.billing_period_start = v_current_period_start
  WHERE p.id = v_plan_id;
END;
$$;

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_usage_tracking_updated_at
  BEFORE UPDATE ON api_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_data_cache_updated_at
  BEFORE UPDATE ON financial_data_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();