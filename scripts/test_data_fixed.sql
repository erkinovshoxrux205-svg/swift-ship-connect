-- =============================================
-- Fixed Test Data Script - No Foreign Key Issues
-- =============================================

-- Create basic test data without foreign key dependencies
-- This will work even without auth.users records

-- 1. Subscription Plans (no dependencies)
INSERT INTO public.subscription_plans (name, description, price, duration_days, features, required_role)
VALUES 
  ('Basic', 'Basic plan for individuals', 10.00, 30, '["Basic support", "Up to 5 orders/month"]', 'client'),
  ('Premium', 'Premium plan for businesses', 50.00, 30, '["Priority support", "Unlimited orders", "Advanced features"]', 'client'),
  ('Carrier Pro', 'Professional plan for carriers', 30.00, 30, '["Verified badge", "Priority orders", "GPS tracking"]', 'carrier')
ON CONFLICT DO NOTHING;

-- 2. Promo Codes (no dependencies)
INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order_value, max_uses, used_count, expires_at, is_active)
VALUES 
  ('WELCOME10', 'percentage', 10.0, 50.0, 100, 0, NOW() + INTERVAL '30 days', true),
  ('FLAT20', 'fixed', 20.0, 100.0, 50, 0, NOW() + INTERVAL '60 days', true)
ON CONFLICT (code) DO NOTHING;

-- 3. Test Profiles with NULL user_id (temporary)
INSERT INTO public.profiles (id, user_id, full_name, email, account_status, email_verified, email_verified_at)
VALUES 
  (gen_random_uuid(), NULL, 'Admin User', 'admin@test.com', 'active', true, now()),
  (gen_random_uuid(), NULL, 'John Client', 'client@test.com', 'active', true, now()),
  (gen_random_uuid(), NULL, 'Mike Carrier', 'carrier@test.com', 'active', true, now())
ON CONFLICT (user_id) DO NOTHING;

-- Note: Orders, Deals, Messages, etc. require real user_id from auth.users
-- These will be created when users register through Firebase Auth

-- Success message
SELECT 'Database schema created successfully! Ready for Firebase Auth integration.' as status;
