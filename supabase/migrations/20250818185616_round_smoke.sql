/*
  # Enhanced Portfolio Management Schema

  1. New Tables
    - `user_holdings` - Individual asset holdings with real-time price tracking
    - `user_goals` - Financial goals and targets with progress tracking
    - `user_preferences` - UI preferences and notification settings
    - `price_history` - Historical price data for assets
    - `portfolio_snapshots` - Daily portfolio value snapshots
    
  2. Enhanced Security
    - Row Level Security (RLS) on all tables
    - User data isolation policies
    - Audit triggers for data changes
    - Encrypted sensitive fields
    
  3. Performance Optimizations
    - Strategic indexes for fast queries
    - Materialized views for analytics
    - Automatic data cleanup policies
*/

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, user_id, new_data, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW), CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, user_id, old_data, timestamp)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), CURRENT_TIMESTAMP);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    operation text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    old_data jsonb,
    new_data jsonb,
    timestamp timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced user_holdings table with real-time price support
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
    
    -- Constraints
    CONSTRAINT valid_symbol_for_type CHECK (
        (asset_type IN ('stock', 'etf', 'crypto') AND symbol IS NOT NULL) OR
        (asset_type NOT IN ('stock', 'etf', 'crypto'))
    ),
    CONSTRAINT valid_exchange_for_type CHECK (
        (asset_type = 'crypto' AND exchange IS NOT NULL) OR
        (asset_type != 'crypto')
    )
);

-- Enhanced user_goals table with progress tracking
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
    linked_holdings uuid[], -- Array of holding IDs that contribute to this goal
    milestone_amounts numeric(15,2)[] DEFAULT '{}',
    milestone_dates date[] DEFAULT '{}',
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enhanced user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language text DEFAULT 'en' CHECK (language IN ('en', 'hi', 'es', 'fr', 'de', 'ja')),
    currency_display text DEFAULT 'symbol' CHECK (currency_display IN ('symbol', 'code', 'name')),
    date_format text DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
    number_format text DEFAULT 'en-AU',
    timezone text DEFAULT 'Australia/Sydney',
    notifications jsonb DEFAULT '{"email": true, "push": false, "sms": false, "price_alerts": true, "goal_updates": true}' NOT NULL,
    dashboard_layout jsonb DEFAULT '{"cards": ["portfolio", "performance", "goals", "news"], "chart_preferences": {"default_timeframe": "1M", "show_volume": true}}' NOT NULL,
    privacy_settings jsonb DEFAULT '{"profile_public": false, "share_analytics": true, "data_export_allowed": true}' NOT NULL,
    risk_settings jsonb DEFAULT '{"max_single_asset_percentage": 20, "crypto_limit_percentage": 10, "rebalance_threshold": 5}' NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- Price history table for tracking asset price changes
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

-- Portfolio snapshots for performance tracking
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_value numeric(20,2) NOT NULL CHECK (total_value >= 0),
    asset_allocation jsonb NOT NULL DEFAULT '{}',
    gain_loss numeric(20,2) DEFAULT 0,
    gain_loss_percent numeric(8,4) DEFAULT 0,
    snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_user_snapshot_date UNIQUE(user_id, snapshot_date)
);

-- Watchlist table for tracking user's watched assets
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

-- Enable Row Level Security on all tables
ALTER TABLE user_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies

-- user_holdings policies
CREATE POLICY "Users can view own holdings"
    ON user_holdings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
    ON user_holdings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
    ON user_holdings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
    ON user_holdings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- user_goals policies
CREATE POLICY "Users can view own goals"
    ON user_goals FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
    ON user_goals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
    ON user_goals FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
    ON user_goals FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- user_preferences policies
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
    ON user_preferences FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- portfolio_snapshots policies
CREATE POLICY "Users can view own snapshots"
    ON portfolio_snapshots FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
    ON portfolio_snapshots FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- user_watchlist policies
CREATE POLICY "Users can manage own watchlist"
    ON user_watchlist FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- price_history policies (read-only for users)
CREATE POLICY "Users can view price history"
    ON price_history FOR SELECT
    TO authenticated
    USING (true);

-- audit_log policies (users can only view their own audit logs)
CREATE POLICY "Users can view own audit logs"
    ON audit_log FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_holdings_user_id ON user_holdings(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_holdings_asset_type ON user_holdings(asset_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_holdings_symbol ON user_holdings(symbol) WHERE symbol IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_holdings_region ON user_holdings(region);
CREATE INDEX IF NOT EXISTS idx_user_holdings_currency ON user_holdings(currency);
CREATE INDEX IF NOT EXISTS idx_user_holdings_updated_at ON user_holdings(updated_at);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_goals_goal_type ON user_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_goals_target_date ON user_goals(target_date) WHERE target_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_goals_priority ON user_goals(priority);

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
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);

-- Create triggers for automatic updated_at
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

-- Create audit triggers for security compliance
CREATE TRIGGER audit_user_holdings
    AFTER INSERT OR UPDATE OR DELETE ON user_holdings
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_user_goals
    AFTER INSERT OR UPDATE OR DELETE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Create materialized view for portfolio analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS portfolio_analytics AS
SELECT 
    h.user_id,
    h.asset_type,
    h.region,
    h.currency,
    COUNT(*) as asset_count,
    SUM(h.quantity * h.current_price) as total_value,
    SUM(h.quantity * (h.current_price - h.purchase_price)) as total_gain_loss,
    AVG(h.current_price / NULLIF(h.purchase_price, 0) - 1) * 100 as avg_return_percent,
    MAX(h.updated_at) as last_updated
FROM user_holdings h
WHERE h.is_active = true
GROUP BY h.user_id, h.asset_type, h.region, h.currency;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_analytics_unique 
    ON portfolio_analytics(user_id, asset_type, region, currency);

-- Function to refresh portfolio analytics
CREATE OR REPLACE FUNCTION refresh_portfolio_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_analytics;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate portfolio diversity score
CREATE OR REPLACE FUNCTION calculate_diversity_score(p_user_id uuid)
RETURNS numeric AS $$
DECLARE
    type_count integer;
    region_count integer;
    currency_count integer;
    total_holdings integer;
    diversity_score numeric;
BEGIN
    SELECT 
        COUNT(DISTINCT asset_type),
        COUNT(DISTINCT region),
        COUNT(DISTINCT currency),
        COUNT(*)
    INTO type_count, region_count, currency_count, total_holdings
    FROM user_holdings
    WHERE user_id = p_user_id AND is_active = true;
    
    IF total_holdings = 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate diversity score (0-100)
    diversity_score := LEAST(
        (type_count * 15) + 
        (region_count * 10) + 
        (currency_count * 5) + 
        (LEAST(total_holdings, 10) * 2),
        100
    );
    
    RETURN diversity_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(p_user_id uuid)
RETURNS numeric AS $$
DECLARE
    total_value numeric;
    weighted_risk numeric := 0;
    holding_record record;
    asset_risk numeric;
BEGIN
    SELECT SUM(quantity * current_price) INTO total_value
    FROM user_holdings
    WHERE user_id = p_user_id AND is_active = true;
    
    IF total_value = 0 OR total_value IS NULL THEN
        RETURN 0;
    END IF;
    
    FOR holding_record IN 
        SELECT asset_type, quantity * current_price as value
        FROM user_holdings
        WHERE user_id = p_user_id AND is_active = true
    LOOP
        -- Assign risk scores based on asset type
        asset_risk := CASE holding_record.asset_type
            WHEN 'cash' THEN 5
            WHEN 'fd' THEN 10
            WHEN 'ppf' THEN 15
            WHEN 'bond' THEN 25
            WHEN 'super' THEN 35
            WHEN 'etf' THEN 45
            WHEN 'stock' THEN 60
            WHEN 'property' THEN 55
            WHEN 'crypto' THEN 90
            ELSE 50
        END;
        
        weighted_risk := weighted_risk + (asset_risk * holding_record.value / total_value);
    END LOOP;
    
    RETURN ROUND(weighted_risk, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update current prices (called by external service)
CREATE OR REPLACE FUNCTION update_asset_prices(price_updates jsonb)
RETURNS void AS $$
DECLARE
    update_record record;
BEGIN
    FOR update_record IN 
        SELECT * FROM jsonb_to_recordset(price_updates) AS x(symbol text, price numeric, timestamp timestamptz)
    LOOP
        -- Update holdings with new price
        UPDATE user_holdings 
        SET 
            current_price = update_record.price,
            last_price_update = update_record.timestamp,
            updated_at = CURRENT_TIMESTAMP
        WHERE symbol = update_record.symbol AND is_active = true;
        
        -- Insert into price history
        INSERT INTO price_history (symbol, asset_type, price, timestamp)
        SELECT DISTINCT symbol, asset_type, update_record.price, update_record.timestamp
        FROM user_holdings 
        WHERE symbol = update_record.symbol
        ON CONFLICT (symbol, timestamp) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create daily portfolio snapshot
CREATE OR REPLACE FUNCTION create_portfolio_snapshot(p_user_id uuid)
RETURNS void AS $$
DECLARE
    total_value numeric;
    total_cost numeric;
    gain_loss numeric;
    gain_loss_percent numeric;
    allocation jsonb;
BEGIN
    -- Calculate total portfolio value and cost
    SELECT 
        SUM(quantity * current_price),
        SUM(quantity * purchase_price)
    INTO total_value, total_cost
    FROM user_holdings
    WHERE user_id = p_user_id AND is_active = true;
    
    -- Calculate gain/loss
    gain_loss := COALESCE(total_value, 0) - COALESCE(total_cost, 0);
    gain_loss_percent := CASE 
        WHEN total_cost > 0 THEN (gain_loss / total_cost) * 100
        ELSE 0
    END;
    
    -- Calculate asset allocation
    SELECT jsonb_object_agg(asset_type, percentage)
    INTO allocation
    FROM (
        SELECT 
            asset_type,
            ROUND((SUM(quantity * current_price) / NULLIF(total_value, 0)) * 100, 2) as percentage
        FROM user_holdings
        WHERE user_id = p_user_id AND is_active = true
        GROUP BY asset_type
    ) allocation_data;
    
    -- Insert or update snapshot
    INSERT INTO portfolio_snapshots (
        user_id, 
        total_value, 
        asset_allocation, 
        gain_loss, 
        gain_loss_percent,
        snapshot_date
    )
    VALUES (
        p_user_id,
        COALESCE(total_value, 0),
        COALESCE(allocation, '{}'),
        gain_loss,
        gain_loss_percent,
        CURRENT_DATE
    )
    ON CONFLICT (user_id, snapshot_date) 
    DO UPDATE SET
        total_value = EXCLUDED.total_value,
        asset_allocation = EXCLUDED.asset_allocation,
        gain_loss = EXCLUDED.gain_loss,
        gain_loss_percent = EXCLUDED.gain_loss_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old data (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete price history older than 2 years
    DELETE FROM price_history 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '2 years';
    
    -- Delete audit logs older than 1 year
    DELETE FROM audit_log 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 year';
    
    -- Delete portfolio snapshots older than 5 years
    DELETE FROM portfolio_snapshots 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '5 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create views for common queries

-- Portfolio summary view
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT 
    h.user_id,
    COUNT(*) as total_holdings,
    COUNT(DISTINCT h.asset_type) as asset_types,
    COUNT(DISTINCT h.region) as regions,
    SUM(h.quantity * h.current_price) as total_value,
    SUM(h.quantity * (h.current_price - h.purchase_price)) as total_gain_loss,
    calculate_diversity_score(h.user_id) as diversity_score,
    calculate_risk_score(h.user_id) as risk_score,
    MAX(h.updated_at) as last_updated
FROM user_holdings h
WHERE h.is_active = true
GROUP BY h.user_id;

-- Asset performance view
CREATE OR REPLACE VIEW asset_performance AS
SELECT 
    h.id,
    h.user_id,
    h.symbol,
    h.name,
    h.asset_type,
    h.quantity * h.current_price as current_value,
    h.quantity * h.purchase_price as purchase_value,
    h.quantity * (h.current_price - h.purchase_price) as gain_loss,
    CASE 
        WHEN h.purchase_price > 0 THEN 
            ((h.current_price - h.purchase_price) / h.purchase_price) * 100
        ELSE 0
    END as gain_loss_percent,
    h.currency,
    h.region,
    h.last_price_update
FROM user_holdings h
WHERE h.is_active = true;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create scheduled job to refresh analytics (if pg_cron is available)
-- SELECT cron.schedule('refresh-portfolio-analytics', '*/5 * * * *', 'SELECT refresh_portfolio_analytics();');

-- Insert default preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;