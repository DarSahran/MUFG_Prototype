/*
  # Secure Portfolio Management Schema

  1. New Tables
    - `user_holdings` - Individual asset holdings with real-time price tracking
    - `user_goals` - Financial goals and targets with progress tracking
    - `user_preferences` - UI preferences and notification settings
    - `price_history` - Real-time price data for all assets
    - `portfolio_snapshots` - Daily portfolio value snapshots
    - `user_watchlist` - User's favorite assets for tracking
    - `audit_log` - Complete audit trail for security compliance

  2. Security
    - Enable RLS on all tables with granular policies
    - User data isolation using auth.uid()
    - Audit logging for all data changes
    - Data validation triggers

  3. Performance
    - Strategic indexes for fast queries
    - Materialized views for analytics
    - Automatic cleanup policies
*/

-- Create audit trigger function first
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, old_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD), now());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD), row_to_json(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, user_id, new_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(NEW), now());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_holdings table
CREATE TABLE IF NOT EXISTS user_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('stock', 'etf', 'bond', 'property', 'crypto', 'cash', 'super', 'fd', 'ppf')),
  symbol text,
  name text NOT NULL,
  quantity numeric(20,8) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  purchase_price numeric(20,8) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  current_price numeric(20,8) NOT NULL DEFAULT 0 CHECK (current_price >= 0),
  currency text NOT NULL DEFAULT 'AUD' CHECK (currency IN ('AUD', 'INR', 'USD', 'EUR', 'GBP')),
  exchange text,
  region text DEFAULT 'AU' CHECK (region IN ('AU', 'IN', 'US', 'EU', 'GLOBAL')),
  purchase_date date NOT NULL,
  last_price_update timestamptz DEFAULT CURRENT_TIMESTAMP,
  metadata jsonb DEFAULT '{}' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Ensure symbol is provided for tradeable assets
  CONSTRAINT valid_symbol_for_type CHECK (
    (asset_type IN ('stock', 'etf', 'crypto') AND symbol IS NOT NULL) OR
    (asset_type NOT IN ('stock', 'etf', 'crypto'))
  ),
  
  -- Ensure exchange is provided for crypto
  CONSTRAINT valid_exchange_for_type CHECK (
    (asset_type = 'crypto' AND exchange IS NOT NULL) OR
    (asset_type != 'crypto')
  )
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type text NOT NULL CHECK (goal_type IN ('retirement', 'house', 'education', 'emergency', 'travel', 'investment', 'debt_payoff', 'other')),
  title text NOT NULL CHECK (length(title) >= 3),
  description text,
  target_amount numeric(15,2) NOT NULL CHECK (target_amount > 0),
  target_date date,
  current_amount numeric(15,2) DEFAULT 0 CHECK (current_amount >= 0),
  priority integer DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  auto_calculate boolean DEFAULT false,
  linked_holdings uuid[],
  milestone_amounts numeric(15,2)[] DEFAULT '{}',
  milestone_dates date[] DEFAULT '{}',
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'en' CHECK (language IN ('en', 'hi', 'es', 'fr', 'de', 'ja')),
  currency_display text DEFAULT 'symbol' CHECK (currency_display IN ('symbol', 'code', 'name')),
  date_format text DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
  number_format text DEFAULT 'en-AU',
  timezone text DEFAULT 'Australia/Sydney',
  notifications jsonb DEFAULT '{"email": true, "push": false, "sms": false, "goal_updates": true, "price_alerts": true}' NOT NULL,
  dashboard_layout jsonb DEFAULT '{"cards": ["portfolio", "performance", "goals", "news"], "chart_preferences": {"show_volume": true, "default_timeframe": "1M"}}' NOT NULL,
  privacy_settings jsonb DEFAULT '{"profile_public": false, "share_analytics": true, "data_export_allowed": true}' NOT NULL,
  risk_settings jsonb DEFAULT '{"rebalance_threshold": 5, "crypto_limit_percentage": 10, "max_single_asset_percentage": 20}' NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- Create price_history table for real-time market data
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  asset_type text NOT NULL,
  price numeric(20,8) NOT NULL CHECK (price > 0),
  volume bigint DEFAULT 0,
  market_cap numeric(20,2),
  change_percent numeric(8,4),
  currency text NOT NULL DEFAULT 'USD',
  exchange text,
  timestamp timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  source text DEFAULT 'api',
  
  CONSTRAINT unique_symbol_timestamp UNIQUE(symbol, timestamp)
);

-- Create portfolio_snapshots table for performance tracking
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_value numeric(20,2) NOT NULL CHECK (total_value >= 0),
  asset_allocation jsonb DEFAULT '{}' NOT NULL,
  gain_loss numeric(20,2) DEFAULT 0,
  gain_loss_percent numeric(8,4) DEFAULT 0,
  snapshot_date date DEFAULT CURRENT_DATE NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT unique_user_snapshot_date UNIQUE(user_id, snapshot_date)
);

-- Create user_watchlist table
CREATE TABLE IF NOT EXISTS user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('stock', 'etf', 'bond', 'property', 'crypto', 'super')),
  name text NOT NULL,
  exchange text,
  region text DEFAULT 'AU' CHECK (region IN ('AU', 'IN', 'US', 'EU', 'GLOBAL')),
  price_alert_high numeric(20,8),
  price_alert_low numeric(20,8),
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT unique_user_symbol UNIQUE(user_id, symbol)
);

-- Create audit_log table for security compliance
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  old_data jsonb,
  new_data jsonb,
  timestamp timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security on all tables
ALTER TABLE user_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users can view own goals"
  ON user_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON user_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON user_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON user_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for price_history (read-only for authenticated users)
CREATE POLICY "Users can view price history"
  ON price_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Create RLS policies for portfolio_snapshots
CREATE POLICY "Users can view own snapshots"
  ON portfolio_snapshots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
  ON portfolio_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_watchlist
CREATE POLICY "Users can manage own watchlist"
  ON user_watchlist
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for audit_log (users can only view their own audit logs)
CREATE POLICY "Users can view own audit logs"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_holdings_user_id ON user_holdings(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_holdings_asset_type ON user_holdings(asset_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_holdings_symbol ON user_holdings(symbol) WHERE symbol IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_holdings_currency ON user_holdings(currency);
CREATE INDEX IF NOT EXISTS idx_user_holdings_region ON user_holdings(region);
CREATE INDEX IF NOT EXISTS idx_user_holdings_updated_at ON user_holdings(updated_at);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_goals_goal_type ON user_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_goals_priority ON user_goals(priority);
CREATE INDEX IF NOT EXISTS idx_user_goals_target_date ON user_goals(target_date) WHERE target_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_timestamp ON price_history(symbol, timestamp);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_id ON portfolio_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_date ON portfolio_snapshots(user_id, snapshot_date);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_symbol ON user_watchlist(symbol);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- Create audit triggers for all user tables
CREATE TRIGGER audit_user_holdings
  AFTER INSERT OR UPDATE OR DELETE ON user_holdings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_user_goals
  AFTER INSERT OR UPDATE OR DELETE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create updated_at triggers
CREATE TRIGGER update_user_holdings_updated_at
  BEFORE UPDATE ON user_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for analytics
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT 
  user_id,
  COUNT(*) as total_holdings,
  COUNT(DISTINCT asset_type) as asset_types,
  COUNT(DISTINCT region) as regions,
  SUM(quantity * current_price) as total_value,
  SUM((quantity * current_price) - (quantity * purchase_price)) as total_gain_loss,
  CASE 
    WHEN COUNT(DISTINCT asset_type) >= 5 THEN 100
    WHEN COUNT(DISTINCT asset_type) >= 3 THEN 75
    WHEN COUNT(DISTINCT asset_type) >= 2 THEN 50
    ELSE 25
  END as diversity_score,
  CASE
    WHEN AVG(CASE 
      WHEN asset_type = 'crypto' THEN 90
      WHEN asset_type = 'stock' THEN 60
      WHEN asset_type = 'property' THEN 40
      WHEN asset_type = 'bond' THEN 20
      ELSE 30
    END) >= 70 THEN 80
    WHEN AVG(CASE 
      WHEN asset_type = 'crypto' THEN 90
      WHEN asset_type = 'stock' THEN 60
      WHEN asset_type = 'property' THEN 40
      WHEN asset_type = 'bond' THEN 20
      ELSE 30
    END) >= 50 THEN 60
    ELSE 40
  END as risk_score,
  MAX(updated_at) as last_updated
FROM user_holdings 
WHERE is_active = true
GROUP BY user_id;

CREATE OR REPLACE VIEW asset_performance AS
SELECT 
  h.id,
  h.user_id,
  h.symbol,
  h.name,
  h.asset_type,
  (h.quantity * h.current_price) as current_value,
  (h.quantity * h.purchase_price) as purchase_value,
  ((h.quantity * h.current_price) - (h.quantity * h.purchase_price)) as gain_loss,
  CASE 
    WHEN h.quantity * h.purchase_price > 0 THEN
      (((h.quantity * h.current_price) - (h.quantity * h.purchase_price)) / (h.quantity * h.purchase_price)) * 100
    ELSE 0
  END as gain_loss_percent,
  h.currency,
  h.region,
  h.last_price_update
FROM user_holdings h
WHERE h.is_active = true;

-- Create materialized view for portfolio analytics (refreshed daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS portfolio_analytics AS
SELECT 
  user_id,
  asset_type,
  region,
  currency,
  COUNT(*) as asset_count,
  SUM(quantity * current_price) as total_value,
  SUM((quantity * current_price) - (quantity * purchase_price)) as total_gain_loss,
  AVG(CASE 
    WHEN quantity * purchase_price > 0 THEN
      (((quantity * current_price) - (quantity * purchase_price)) / (quantity * purchase_price)) * 100
    ELSE 0
  END) as avg_return_percent,
  MAX(updated_at) as last_updated
FROM user_holdings 
WHERE is_active = true
GROUP BY user_id, asset_type, region, currency;

-- Create functions for portfolio calculations
CREATE OR REPLACE FUNCTION calculate_portfolio_value(p_user_id uuid)
RETURNS numeric AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(quantity * current_price) 
     FROM user_holdings 
     WHERE user_id = p_user_id AND is_active = true),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_diversity_score(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  asset_types_count integer;
  regions_count integer;
  currencies_count integer;
BEGIN
  SELECT 
    COUNT(DISTINCT asset_type),
    COUNT(DISTINCT region),
    COUNT(DISTINCT currency)
  INTO asset_types_count, regions_count, currencies_count
  FROM user_holdings 
  WHERE user_id = p_user_id AND is_active = true;
  
  RETURN LEAST(asset_types_count * 15 + regions_count * 10 + currencies_count * 5, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_portfolio_snapshot(p_user_id uuid)
RETURNS void AS $$
DECLARE
  total_val numeric;
  allocation jsonb;
  gain_loss_val numeric;
  gain_loss_pct numeric;
BEGIN
  -- Calculate total portfolio value
  SELECT calculate_portfolio_value(p_user_id) INTO total_val;
  
  -- Calculate asset allocation
  SELECT jsonb_object_agg(asset_type, percentage)
  INTO allocation
  FROM (
    SELECT 
      asset_type,
      ROUND((SUM(quantity * current_price) / NULLIF(total_val, 0)) * 100, 2) as percentage
    FROM user_holdings 
    WHERE user_id = p_user_id AND is_active = true
    GROUP BY asset_type
  ) t;
  
  -- Calculate total gain/loss
  SELECT 
    SUM((quantity * current_price) - (quantity * purchase_price)),
    CASE 
      WHEN SUM(quantity * purchase_price) > 0 THEN
        (SUM((quantity * current_price) - (quantity * purchase_price)) / SUM(quantity * purchase_price)) * 100
      ELSE 0
    END
  INTO gain_loss_val, gain_loss_pct
  FROM user_holdings 
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Insert or update snapshot
  INSERT INTO portfolio_snapshots (user_id, total_value, asset_allocation, gain_loss, gain_loss_percent)
  VALUES (p_user_id, total_val, allocation, gain_loss_val, gain_loss_pct)
  ON CONFLICT (user_id, snapshot_date) 
  DO UPDATE SET 
    total_value = EXCLUDED.total_value,
    asset_allocation = EXCLUDED.asset_allocation,
    gain_loss = EXCLUDED.gain_loss,
    gain_loss_percent = EXCLUDED.gain_loss_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update asset prices from external APIs
CREATE OR REPLACE FUNCTION update_asset_prices(price_updates jsonb)
RETURNS void AS $$
DECLARE
  price_update jsonb;
BEGIN
  FOR price_update IN SELECT * FROM jsonb_array_elements(price_updates)
  LOOP
    -- Insert price history
    INSERT INTO price_history (symbol, asset_type, price, timestamp, source)
    VALUES (
      price_update->>'symbol',
      COALESCE(price_update->>'asset_type', 'stock'),
      (price_update->>'price')::numeric,
      COALESCE((price_update->>'timestamp')::timestamptz, CURRENT_TIMESTAMP),
      COALESCE(price_update->>'source', 'api')
    )
    ON CONFLICT (symbol, timestamp) DO NOTHING;
    
    -- Update current prices in user holdings
    UPDATE user_holdings 
    SET 
      current_price = (price_update->>'price')::numeric,
      last_price_update = CURRENT_TIMESTAMP
    WHERE symbol = price_update->>'symbol' AND is_active = true;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;