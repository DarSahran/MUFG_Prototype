/*
  # Fix Plan Assignment and Usage Tracking

  1. Updates
    - Fix plan assignment for existing users
    - Update usage tracking to work with weekly/monthly periods
    - Add proper default plan assignment
    
  2. Functions
    - Enhanced get_user_plan_info function
    - Better increment_api_usage function
    
  3. Data
    - Ensure all users have a plan assigned
*/

-- Update user profiles to have default plan if null
UPDATE user_profiles 
SET plan_id = (SELECT id FROM plans WHERE name = 'Free' LIMIT 1)
WHERE plan_id IS NULL;

-- Create or replace the get_user_plan_info function
CREATE OR REPLACE FUNCTION get_user_plan_info(p_user_id uuid)
RETURNS TABLE (
  plan_name text,
  api_call_limit integer,
  current_calls integer,
  remaining_calls integer,
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  realtime_access boolean,
  advanced_analytics boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id uuid;
  v_plan_name text;
  v_api_call_limit integer;
  v_realtime_access boolean;
  v_advanced_analytics boolean;
  v_current_calls integer := 0;
  v_billing_start timestamptz;
  v_billing_end timestamptz;
  v_reset_period text;
BEGIN
  -- Get user's plan information
  SELECT up.plan_id, p.name, p.api_call_limit, p.realtime_access, p.advanced_analytics
  INTO v_plan_id, v_plan_name, v_api_call_limit, v_realtime_access, v_advanced_analytics
  FROM user_profiles up
  JOIN plans p ON up.plan_id = p.id
  WHERE up.user_id = p_user_id;
  
  -- If no plan found, assign Free plan
  IF v_plan_id IS NULL THEN
    SELECT id, name, api_call_limit, realtime_access, advanced_analytics
    INTO v_plan_id, v_plan_name, v_api_call_limit, v_realtime_access, v_advanced_analytics
    FROM plans 
    WHERE name = 'Free' 
    LIMIT 1;
    
    -- Update user profile with Free plan
    UPDATE user_profiles 
    SET plan_id = v_plan_id 
    WHERE user_id = p_user_id;
  END IF;
  
  -- Determine billing period based on plan
  IF v_plan_name = 'Free' THEN
    -- Weekly reset for Free plan
    v_billing_start := date_trunc('week', now());
    v_billing_end := v_billing_start + interval '1 week';
  ELSE
    -- Monthly reset for paid plans
    v_billing_start := date_trunc('month', now());
    v_billing_end := v_billing_start + interval '1 month';
  END IF;
  
  -- Get current usage for this billing period
  SELECT COALESCE(aut.current_calls, 0)
  INTO v_current_calls
  FROM api_usage_tracking aut
  WHERE aut.user_id = p_user_id 
    AND aut.billing_period_start = v_billing_start;
  
  -- If no usage record exists, create one
  IF NOT FOUND THEN
    INSERT INTO api_usage_tracking (user_id, plan_id, current_calls, billing_period_start, billing_period_end)
    VALUES (p_user_id, v_plan_id, 0, v_billing_start, v_billing_end)
    ON CONFLICT (user_id, billing_period_start) DO NOTHING;
    v_current_calls := 0;
  END IF;
  
  -- Return the results
  RETURN QUERY SELECT 
    v_plan_name,
    v_api_call_limit,
    v_current_calls,
    GREATEST(0, v_api_call_limit - v_current_calls),
    v_billing_start,
    v_billing_end,
    v_realtime_access,
    v_advanced_analytics;
END;
$$;

-- Create or replace the increment_api_usage function
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_info record;
  v_new_count integer;
BEGIN
  -- Get current plan info
  SELECT * INTO v_plan_info FROM get_user_plan_info(p_user_id);
  
  -- Check if user has remaining calls
  IF v_plan_info.remaining_calls <= 0 THEN
    RETURN false;
  END IF;
  
  -- Increment the usage count
  INSERT INTO api_usage_tracking (
    user_id, 
    plan_id, 
    current_calls, 
    billing_period_start, 
    billing_period_end
  )
  VALUES (
    p_user_id,
    (SELECT plan_id FROM user_profiles WHERE user_id = p_user_id),
    1,
    v_plan_info.billing_period_start,
    v_plan_info.billing_period_end
  )
  ON CONFLICT (user_id, billing_period_start) 
  DO UPDATE SET 
    current_calls = api_usage_tracking.current_calls + 1,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_user_billing ON api_usage_tracking(user_id, billing_period_start);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_id ON user_profiles(plan_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_plan_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_api_usage(uuid) TO authenticated;