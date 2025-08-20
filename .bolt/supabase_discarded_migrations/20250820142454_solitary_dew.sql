@@ .. @@
 -- Insert default plans
-INSERT INTO plans (name, description, api_call_limit, realtime_access, advanced_analytics, priority_support, features, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly) VALUES
-('Free', 'Basic portfolio tracking and monthly insights', 10, false, false, false, '["Basic portfolio tracking", "Monthly AI insights", "Educational content", "Email support"]', 0, 0, null, null),
-('Pro', 'Advanced analytics and weekly insights', 100, true, true, false, '["Everything in Free", "Weekly AI insights", "Real-time market data", "Advanced forecasting", "Priority email support"]', 29, 299, 'price_1Ry7t7CrbvEh5Z2rRrBDBC9V', 'price_1Ry7uFCrbvEh5Z2rfksYAgi3'),
-('Family', 'Family financial planning with shared goals', 200, true, true, true, '["Everything in Pro", "Up to 4 family accounts", "Shared financial goals", "Family reporting", "Priority support"]', 49, 499, 'price_1Ry7taCrbvEh5Z2r6oamOPoQ', 'price_1Ry7udCrbvEh5Z2r4DUcNQlB'),
-('Enterprise', 'Advanced features for wealth managers', 1000, true, true, true, '["Everything in Family", "Unlimited client accounts", "API access", "Custom branding", "Dedicated support"]', 199, 1999, 'price_1Ry7v4CrbvEh5Z2rgmtLGpfT', 'price_1Ry7vdCrbvEh5Z2rvNwlvR4H')
-ON CONFLICT (name) DO UPDATE SET
-  description = EXCLUDED.description,
-  api_call_limit = EXCLUDED.api_call_limit,
-  realtime_access = EXCLUDED.realtime_access,
-  advanced_analytics = EXCLUDED.advanced_analytics,
-  priority_support = EXCLUDED.priority_support,
-  features = EXCLUDED.features,
-  price_monthly = EXCLUDED.price_monthly,
-  price_yearly = EXCLUDED.price_yearly,
-  stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
-  stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly;
+DO $$
+BEGIN
+  -- Insert Free plan if it doesn't exist
+  IF NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Free') THEN
+    INSERT INTO plans (name, description, api_call_limit, realtime_access, advanced_analytics, priority_support, features, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly) 
+    VALUES ('Free', 'Basic portfolio tracking and monthly insights', 10, false, false, false, '["Basic portfolio tracking", "Monthly AI insights", "Educational content", "Email support"]', 0, 0, null, null);
+  END IF;
+  
+  -- Insert Pro plan if it doesn't exist
+  IF NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Pro') THEN
+    INSERT INTO plans (name, description, api_call_limit, realtime_access, advanced_analytics, priority_support, features, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly) 
+    VALUES ('Pro', 'Advanced analytics and weekly insights', 100, true, true, false, '["Everything in Free", "Weekly AI insights", "Real-time market data", "Advanced forecasting", "Priority email support"]', 29, 299, 'price_1Ry7t7CrbvEh5Z2rRrBDBC9V', 'price_1Ry7uFCrbvEh5Z2rfksYAgi3');
+  END IF;
+  
+  -- Insert Family plan if it doesn't exist
+  IF NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Family') THEN
+    INSERT INTO plans (name, description, api_call_limit, realtime_access, advanced_analytics, priority_support, features, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly) 
+    VALUES ('Family', 'Family financial planning with shared goals', 200, true, true, true, '["Everything in Pro", "Up to 4 family accounts", "Shared financial goals", "Family reporting", "Priority support"]', 49, 499, 'price_1Ry7taCrbvEh5Z2r6oamOPoQ', 'price_1Ry7udCrbvEh5Z2r4DUcNQlB');
+  END IF;
+  
+  -- Insert Enterprise plan if it doesn't exist
+  IF NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Enterprise') THEN
+    INSERT INTO plans (name, description, api_call_limit, realtime_access, advanced_analytics, priority_support, features, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly) 
+    VALUES ('Enterprise', 'Advanced features for wealth managers', 1000, true, true, true, '["Everything in Family", "Unlimited client accounts", "API access", "Custom branding", "Dedicated support"]', 199, 1999, 'price_1Ry7v4CrbvEh5Z2rgmtLGpfT', 'price_1Ry7vdCrbvEh5Z2rvNwlvR4H');
+  END IF;
+END $$;
 
 -- Add plan_id to user_profiles if it doesn't exist
 DO $$
@@ .. @@
 -- Create function to increment API usage
 CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id uuid)
 RETURNS void AS $$
+DECLARE
+  current_period_start date;
+  current_period_end date;
+  user_plan_id uuid;
 BEGIN
+  -- Get current billing period dates
+  current_period_start := date_trunc('month', CURRENT_DATE);
+  current_period_end := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
+  
+  -- Get user's plan_id
+  SELECT plan_id INTO user_plan_id FROM user_profiles WHERE user_id = p_user_id;
+  
+  -- Insert or update usage tracking
   INSERT INTO api_usage_tracking (user_id, plan_id, current_calls, billing_period_start, billing_period_end)
-  VALUES (p_user_id, (SELECT plan_id FROM user_profiles WHERE user_id = p_user_id), 1, date_trunc('month', CURRENT_DATE), (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date)
-  ON CONFLICT (user_id, billing_period_start) DO UPDATE SET
-    current_calls = api_usage_tracking.current_calls + 1;
+  VALUES (p_user_id, user_plan_id, 1, current_period_start, current_period_end)
+  ON CONFLICT (user_id, billing_period_start) 
+  DO UPDATE SET current_calls = api_usage_tracking.current_calls + 1;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;