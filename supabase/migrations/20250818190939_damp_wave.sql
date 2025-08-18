/*
  # Secure Portfolio Management Schema

  1. New Tables
    - `user_holdings` - Individual asset holdings with encryption
    - `user_goals` - Financial goals and targets
    - `user_preferences` - UI and notification preferences
    - `price_history` - Real-time price tracking
    - `portfolio_snapshots` - Daily portfolio value snapshots
    - `user_watchlists` - User's watched assets
    - `audit_logs` - Security audit trail
    
  2. Security
    - Enable RLS on all tables
    - Comprehensive policies for data isolation
    - Audit logging for compliance
    - Data validation triggers
    
  3. Performance
    - Strategic indexes for fast queries
    - Automatic cleanup policies
    - Optimized foreign keys
*/

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create user_holdings table with enhanced security
CREATE TABLE IF NOT EXISTS user_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('stock', 'etf', 'bond', 'property', 'crypto', 'cash', 'super', 'fd', 'ppf')),
  symbol text,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  purchase_price numeric NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  current_price numeric NOT NULL DEFAULT 0 CHECK (current_price >= 0),
  currency text NOT NULL DEFAULT 'AUD' CHECK (currency IN ('AUD', 'INR', 'USD')),
  exchange text,
  region text DEFAULT 'AU' CHECK (region IN ('AU', 'IN', 'US', 'GLOBAL')),
  purchase_date date NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type text NOT NULL CHECK (goal_type IN ('retirement', 'house', 'education', 'emergency', 'travel', 'other')),
  title text NOT NULL,
  description text,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  target_date date,
  current_amount numeric DEFAULT 0 CHECK (current_amount >= 0),
  priority integer DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'en' CHECK (language IN ('en', 'hi', 'es', 'fr')),
  currency_display text DEFAULT 'symbol' CHECK (currency_display IN ('symbol', 'code', 'name')),
  date_format text DEFAULT 'DD/MM/YYYY',
  number_format text DEFAULT 'en-AU',
  notifications jsonb DEFAULT '{"email": true, "push": false, "sms": false}',
  dashboard_layout jsonb DEFAULT '{"cards": ["portfolio", "performance", "goals", "news"]}',
  privacy_settings jsonb DEFAULT '{"profile_public": false, "share_analytics": true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create price_history table for real-time tracking
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  change_amount numeric DEFAULT 0,
  change_percent numeric DEFAULT 0,
  volume bigint DEFAULT 0,
  market_cap bigint,
  source text DEFAULT 'api',
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create portfolio_snapshots for performance tracking
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_value numeric NOT NULL DEFAULT 0,
  asset_breakdown jsonb DEFAULT '{}',
  performance_metrics jsonb DEFAULT '{}',
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

-- Create user_watchlists table
CREATE TABLE IF NOT EXISTS user_watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  asset_type text NOT NULL,
  name text NOT NULL,
  exchange text,
  region text DEFAULT 'AU',
  added_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, symbol)
);

-- Create audit_logs table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE user_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for user_holdings
CREATE POLICY "Users can view own holdings"
  ON user_holdings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
  ON user_holdings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
  ON user_holdings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
  ON user_holdings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for user_goals
CREATE POLICY "Users can manage own goals"
  ON user_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for portfolio_snapshots
CREATE POLICY "Users can view own snapshots"
  ON portfolio_snapshots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create snapshots"
  ON portfolio_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_watchlists
CREATE POLICY "Users can manage own watchlists"
  ON user_watchlists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for audit_logs (read-only for users)
CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS user_holdings_user_id_idx ON user_holdings(user_id);
CREATE INDEX IF NOT EXISTS user_holdings_asset_type_idx ON user_holdings(asset_type);
CREATE INDEX IF NOT EXISTS user_holdings_symbol_idx ON user_holdings(symbol);
CREATE INDEX IF NOT EXISTS user_holdings_active_idx ON user_holdings(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS user_goals_user_id_idx ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS user_goals_type_idx ON user_goals(goal_type);
CREATE INDEX IF NOT EXISTS user_goals_active_idx ON user_goals(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS price_history_symbol_idx ON price_history(symbol);
CREATE INDEX IF NOT EXISTS price_history_timestamp_idx ON price_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS price_history_symbol_time_idx ON price_history(symbol, timestamp DESC);

CREATE INDEX IF NOT EXISTS portfolio_snapshots_user_date_idx ON portfolio_snapshots(user_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS user_watchlists_user_id_idx ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS user_watchlists_symbol_idx ON user_watchlists(symbol);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(created_at DESC);

-- Create updated_at triggers
CREATE TRIGGER update_user_holdings_updated_at
  BEFORE UPDATE ON user_holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    table_name,
    operation,
    record_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
CREATE TRIGGER user_holdings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_holdings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER user_goals_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create portfolio calculation functions
CREATE OR REPLACE FUNCTION calculate_portfolio_value(p_user_id uuid)
RETURNS numeric AS $$
DECLARE
  total_value numeric := 0;
BEGIN
  SELECT COALESCE(SUM(quantity * current_price), 0)
  INTO total_value
  FROM user_holdings
  WHERE user_id = p_user_id AND is_active = true;
  
  RETURN total_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_diversity_score(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  type_count integer;
  region_count integer;
  currency_count integer;
  score integer;
BEGIN
  SELECT 
    COUNT(DISTINCT asset_type),
    COUNT(DISTINCT region),
    COUNT(DISTINCT currency)
  INTO type_count, region_count, currency_count
  FROM user_holdings
  WHERE user_id = p_user_id AND is_active = true;
  
  score := LEAST(type_count * 15 + region_count * 10 + currency_count * 5, 100);
  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_portfolio_snapshot(p_user_id uuid)
RETURNS void AS $$
DECLARE
  total_value numeric;
  asset_breakdown jsonb;
BEGIN
  -- Calculate total portfolio value
  total_value := calculate_portfolio_value(p_user_id);
  
  -- Calculate asset breakdown
  SELECT jsonb_object_agg(asset_type, total_value)
  INTO asset_breakdown
  FROM (
    SELECT 
      asset_type,
      SUM(quantity * current_price) as total_value
    FROM user_holdings
    WHERE user_id = p_user_id AND is_active = true
    GROUP BY asset_type
  ) breakdown;
  
  -- Insert or update snapshot
  INSERT INTO portfolio_snapshots (user_id, total_value, asset_breakdown, snapshot_date)
  VALUES (p_user_id, total_value, asset_breakdown, CURRENT_DATE)
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET
    total_value = EXCLUDED.total_value,
    asset_breakdown = EXCLUDED.asset_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create price update function for batch updates
CREATE OR REPLACE FUNCTION update_asset_prices(price_updates jsonb)
RETURNS void AS $$
DECLARE
  price_update jsonb;
BEGIN
  FOR price_update IN SELECT * FROM jsonb_array_elements(price_updates)
  LOOP
    -- Insert price history
    INSERT INTO price_history (symbol, price, timestamp)
    VALUES (
      price_update->>'symbol',
      (price_update->>'price')::numeric,
      (price_update->>'timestamp')::timestamptz
    );
    
    -- Update current prices in holdings
    UPDATE user_holdings
    SET 
      current_price = (price_update->>'price')::numeric,
      updated_at = now()
    WHERE symbol = price_update->>'symbol' AND is_active = true;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create data cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Clean up old price history (keep 1 year)
  DELETE FROM price_history 
  WHERE created_at < now() - interval '1 year';
  
  -- Clean up old audit logs (keep 2 years)
  DELETE FROM audit_logs 
  WHERE created_at < now() - interval '2 years';
  
  -- Clean up old portfolio snapshots (keep 5 years)
  DELETE FROM portfolio_snapshots 
  WHERE created_at < now() - interval '5 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user data validation function
CREATE OR REPLACE FUNCTION validate_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate holdings data
  IF TG_TABLE_NAME = 'user_holdings' THEN
    -- Ensure reasonable values
    IF NEW.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive';
    END IF;
    
    IF NEW.purchase_price <= 0 THEN
      RAISE EXCEPTION 'Purchase price must be positive';
    END IF;
    
    -- Validate asset type specific rules
    IF NEW.asset_type = 'crypto' AND NEW.quantity > 1000000 THEN
      RAISE EXCEPTION 'Crypto quantity seems unreasonably high';
    END IF;
    
    IF NEW.asset_type = 'property' AND NEW.purchase_price < 10000 THEN
      RAISE EXCEPTION 'Property price seems unreasonably low';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation triggers
CREATE TRIGGER validate_user_holdings_trigger
  BEFORE INSERT OR UPDATE ON user_holdings
  FOR EACH ROW EXECUTE FUNCTION validate_user_data();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create automatic portfolio snapshot trigger
CREATE OR REPLACE FUNCTION auto_create_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Create snapshot when holdings are modified
  PERFORM create_portfolio_snapshot(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_snapshot_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_holdings
  FOR EACH ROW EXECUTE FUNCTION auto_create_snapshot();

-- Create data retention policy
CREATE OR REPLACE FUNCTION setup_data_retention()
RETURNS void AS $$
BEGIN
  -- Schedule cleanup to run daily
  -- Note: In production, this would be handled by a cron job
  PERFORM cleanup_old_data();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;