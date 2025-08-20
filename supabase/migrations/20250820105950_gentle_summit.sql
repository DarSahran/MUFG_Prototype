/*
  # Financial AI Advisor System - Plans and Usage Tracking

  1. New Tables
    - `plans` - Subscription plan definitions with API limits
    - `api_usage_tracking` - Track user API usage per billing period
    - `api_request_logs` - Comprehensive logging of all API requests
    - `financial_data_cache` - Cache for external financial data
    - `ai_conversations` - Store AI conversation history

  2. Updates
    - Add plan_id to user_profiles
    - Add usage tracking triggers

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access
*/

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  api_call_limit integer NOT NULL DEFAULT 0,
  realtime_access boolean DEFAULT false,
  advanced_analytics boolean DEFAULT false,
  priority_support boolean DEFAULT false,
  stripe_price_id text,
  monthly_price numeric(10,2) DEFAULT 0,
  yearly_price numeric(10,2) DEFAULT 0,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default plans
INSERT INTO plans (name, description, api_call_limit, realtime_access, advanced_analytics, priority_support, stripe_price_id, monthly_price, features) VALUES
('Free', 'Basic financial insights', 10, false, false, false, null, 0, '["Basic portfolio tracking", "Monthly AI insights", "Educational content"]'),
('Pro', 'Advanced AI advisor', 100, true, true, false, 'price_1Ry7t7CrbvEh5Z2rRrBDBC9V', 29.00, '["Unlimited portfolio holdings", "Weekly AI insights", "Real-time market data", "Advanced forecasting"]'),
('Family', 'Family financial planning', 200, true, true, true, 'price_1Ry7taCrbvEh5Z2r6oamOPoQ', 49.00, '["Everything in Pro", "Up to 4 family accounts", "Shared goals", "Family reporting"]'),
('Enterprise', 'Institutional grade', 1000, true, true, true, 'price_1Ry7v4CrbvEh5Z2rgmtLGpfT', 199.00, '["Everything in Family", "Unlimited client accounts", "API access", "Custom integrations"]')
ON CONFLICT (name) DO NOTHING;

-- Add plan_id to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'plan_id') THEN
    ALTER TABLE user_profiles ADD COLUMN plan_id uuid REFERENCES plans(id) DEFAULT (SELECT id FROM plans WHERE name = 'Free' LIMIT 1);
  END IF;
END $$;

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES plans(id) NOT NULL,
  current_calls integer DEFAULT 0,
  billing_period_start timestamptz DEFAULT now(),
  billing_period_end timestamptz DEFAULT (now() + interval '1 month'),
  last_reset_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, billing_period_start)
);

-- Create API request logs table
CREATE TABLE IF NOT EXISTS api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  request_body jsonb,
  response_body jsonb,
  status_code integer,
  duration_ms integer,
  error_message text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create financial data cache table
CREATE TABLE IF NOT EXISTS financial_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  symbol text,
  data_type text NOT NULL,
  data jsonb NOT NULL,
  source text DEFAULT 'serper',
  last_fetched_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz DEFAULT now()
);

-- Create AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid DEFAULT gen_random_uuid(),
  query text NOT NULL,
  response text NOT NULL,
  query_type text DEFAULT 'financial',
  confidence_score numeric(3,2),
  sources jsonb DEFAULT '[]',
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Plans are viewable by all authenticated users"
  ON plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own usage tracking"
  ON api_usage_tracking FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own request logs"
  ON api_request_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Cache is readable by authenticated users"
  ON financial_data_cache FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_user_id ON api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_billing_period ON api_usage_tracking(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_user_id ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_data_cache_key ON financial_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_financial_data_cache_expires ON financial_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);

-- Create function to reset usage tracking monthly
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE api_usage_tracking 
  SET 
    current_calls = 0,
    billing_period_start = now(),
    billing_period_end = now() + interval '1 month',
    last_reset_date = now()
  WHERE billing_period_end < now();
END;
$$ LANGUAGE plpgsql;

-- Create function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  current_usage integer;
  usage_limit integer;
  user_plan_id uuid;
BEGIN
  -- Get user's plan and current usage
  SELECT up.plan_id INTO user_plan_id
  FROM user_profiles up
  WHERE up.user_id = p_user_id;
  
  SELECT p.api_call_limit INTO usage_limit
  FROM plans p
  WHERE p.id = user_plan_id;
  
  SELECT COALESCE(aut.current_calls, 0) INTO current_usage
  FROM api_usage_tracking aut
  WHERE aut.user_id = p_user_id 
    AND aut.billing_period_end > now();
  
  -- Check if user has exceeded limit
  IF current_usage >= usage_limit THEN
    RETURN false;
  END IF;
  
  -- Increment usage
  INSERT INTO api_usage_tracking (user_id, plan_id, current_calls, billing_period_start, billing_period_end)
  VALUES (
    p_user_id, 
    user_plan_id, 
    1, 
    now(), 
    now() + interval '1 month'
  )
  ON CONFLICT (user_id, billing_period_start) 
  DO UPDATE SET 
    current_calls = api_usage_tracking.current_calls + 1,
    updated_at = now();
    
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_usage_tracking_updated_at
  BEFORE UPDATE ON api_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();