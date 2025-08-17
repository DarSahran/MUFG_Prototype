/*
  # Enhanced User Profile Schema

  1. New Tables
    - `user_holdings` - Individual asset holdings
    - `user_goals` - Financial goals and targets
    - `user_preferences` - UI and notification preferences
    
  2. Updates to existing tables
    - Add region, currency, and additional profile fields
    
  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Add new columns to user_profiles
DO $$
BEGIN
  -- Add region and currency support
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'region') THEN
    ALTER TABLE user_profiles ADD COLUMN region text DEFAULT 'AU' CHECK (region IN ('AU', 'IN', 'US', 'GLOBAL'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'currency') THEN
    ALTER TABLE user_profiles ADD COLUMN currency text DEFAULT 'AUD' CHECK (currency IN ('AUD', 'INR', 'USD'));
  END IF;
  
  -- Add additional profile fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'occupation') THEN
    ALTER TABLE user_profiles ADD COLUMN occupation text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'location') THEN
    ALTER TABLE user_profiles ADD COLUMN location text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE user_profiles ADD COLUMN date_of_birth date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'gender') THEN
    ALTER TABLE user_profiles ADD COLUMN gender text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'marital_status') THEN
    ALTER TABLE user_profiles ADD COLUMN marital_status text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
    ALTER TABLE user_profiles ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
    ALTER TABLE user_profiles ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'social_links') THEN
    ALTER TABLE user_profiles ADD COLUMN social_links jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'investment_preference') THEN
    ALTER TABLE user_profiles ADD COLUMN investment_preference text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'communication_preference') THEN
    ALTER TABLE user_profiles ADD COLUMN communication_preference text DEFAULT 'email';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'two_factor_enabled') THEN
    ALTER TABLE user_profiles ADD COLUMN two_factor_enabled boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_login') THEN
    ALTER TABLE user_profiles ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Create user_holdings table
CREATE TABLE IF NOT EXISTS user_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('stock', 'etf', 'bond', 'property', 'crypto', 'cash', 'super', 'fd', 'ppf')),
  symbol text,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  purchase_price numeric NOT NULL DEFAULT 0,
  current_price numeric NOT NULL DEFAULT 0,
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
  target_amount numeric NOT NULL,
  target_date date,
  current_amount numeric DEFAULT 0,
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

-- Enable Row Level Security
ALTER TABLE user_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_holdings
CREATE POLICY "Users can manage own holdings"
  ON user_holdings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_goals
CREATE POLICY "Users can manage own goals"
  ON user_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_holdings_user_id_idx ON user_holdings(user_id);
CREATE INDEX IF NOT EXISTS user_holdings_asset_type_idx ON user_holdings(asset_type);
CREATE INDEX IF NOT EXISTS user_holdings_symbol_idx ON user_holdings(symbol);
CREATE INDEX IF NOT EXISTS user_goals_user_id_idx ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS user_goals_goal_type_idx ON user_goals(goal_type);
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

-- Create triggers to automatically update updated_at
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