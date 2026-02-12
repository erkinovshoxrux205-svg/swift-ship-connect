-- =============================================
-- Complete Test Data for Fixed Schema
-- Execute after create_schema.sql
-- =============================================

-- 1. Test Profiles (with NULL user_id for now)
INSERT INTO public.profiles (id, user_id, full_name, email, account_status, email_verified, email_verified_at)
VALUES 
  (gen_random_uuid(), NULL, 'Admin User', 'admin@test.com', 'active', true, now()),
  (gen_random_uuid(), NULL, 'John Client', 'client@test.com', 'active', true, now()),
  (gen_random_uuid(), NULL, 'Mike Carrier', 'carrier@test.com', 'active', true, now())
ON CONFLICT (user_id) DO NOTHING;

-- 2. Test User Roles (commented out since user_id is NULL)
-- These will be created when real users register through Firebase Auth
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT 
--   (SELECT user_id FROM public.profiles WHERE email = 'admin@test.com' LIMIT 1), 'admin'
-- UNION ALL
-- SELECT 
--   (SELECT user_id FROM public.profiles WHERE email = 'client@test.com' LIMIT 1), 'client'
-- UNION ALL
-- SELECT 
--   (SELECT user_id FROM public.profiles WHERE email = 'carrier@test.com' LIMIT 1), 'carrier'
-- ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Subscription Plans (no dependencies)
INSERT INTO public.subscription_plans (name, description, price, duration_days, features, required_role)
VALUES 
  ('Basic', 'Basic plan for individuals', 10.00, 30, '["Basic support", "Up to 5 orders/month"]', 'client'),
  ('Premium', 'Premium plan for businesses', 50.00, 30, '["Priority support", "Unlimited orders", "Advanced features"]', 'client'),
  ('Carrier Pro', 'Professional plan for carriers', 30.00, 30, '["Verified badge", "Priority orders", "GPS tracking"]', 'carrier')
ON CONFLICT DO NOTHING;

-- 4. Promo Codes (no dependencies)
INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order_value, max_uses, used_count, expires_at, is_active)
VALUES 
  ('WELCOME10', 'percentage', 10.0, 50.0, 100, 0, NOW() + INTERVAL '30 days', true),
  ('FLAT20', 'fixed', 20.0, 100.0, 50, 0, NOW() + INTERVAL '60 days', true),
  ('SPECIAL2024', 'percentage', 15.0, 75.0, 200, 0, NOW() + INTERVAL '90 days', true)
ON CONFLICT (code) DO NOTHING;

-- 5. Test Order (with NULL client_id for now - will be updated when real users exist)
-- Skip order creation for now since it requires a valid client_id
-- INSERT INTO public.orders (id, client_id, cargo_type, weight, length, width, height, pickup_address, delivery_address, pickup_date, description, status)
-- VALUES 
--   (gen_random_uuid(), NULL, 'Electronics', 50.5, 100.0, 80.0, 60.0, 'Tashkent, Uzbekistan', 'Samarkand, Uzbekistan', NOW() + INTERVAL '7 days', 'Fragile electronic equipment', 'open')
-- ON CONFLICT (id) DO NOTHING;

-- 6. Test AI Conversation (with NULL user_id for now)
INSERT INTO public.ai_conversations (id, user_id, title)
VALUES 
  (gen_random_uuid(), NULL, 'Help with shipping documentation')
ON CONFLICT (id) DO NOTHING;

-- 7. Test AI Messages
INSERT INTO public.ai_messages (conversation_id, role, content)
VALUES 
  ((SELECT id FROM public.ai_conversations WHERE title = 'Help with shipping documentation' LIMIT 1), 'user', 'What documents do I need for international shipping?'),
  ((SELECT id FROM public.ai_conversations WHERE title = 'Help with shipping documentation' LIMIT 1), 'assistant', 'For international shipping, you typically need: commercial invoice, packing list, bill of lading, and any required customs forms.')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 
  'Database test data created successfully!' as status,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.subscription_plans) as plans_count,
  (SELECT COUNT(*) FROM public.promo_codes) as promo_codes_count,
  (SELECT COUNT(*) FROM public.orders) as orders_count,
  (SELECT COUNT(*) FROM public.ai_conversations) as ai_conversations_count,
  'Note: Orders will be created when real users register through Firebase Auth' as info;
