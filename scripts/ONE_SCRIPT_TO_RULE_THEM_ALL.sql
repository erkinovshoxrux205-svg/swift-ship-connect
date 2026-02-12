  -- =============================================
  -- Swift Ship Connect - Complete Working Database
  -- One script to rule them all - Execute this in Supabase Dashboard
  -- =============================================

  -- Clean up first
  DROP SCHEMA IF EXISTS public CASCADE;
  CREATE SCHEMA public;

  -- 1. Create ENUMs
  CREATE TYPE public.app_role AS ENUM ('client', 'carrier', 'admin');
  CREATE TYPE public.order_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
  CREATE TYPE public.deal_status AS ENUM ('pending', 'accepted', 'in_transit', 'delivered', 'cancelled');
  CREATE TYPE public.carrier_type AS ENUM ('driver', 'company');

  -- 2. Create PROFILES table (user_id as TEXT for Firebase compatibility)
  CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    carrier_type carrier_type,
    vehicle_type TEXT,
    company_name TEXT,
    is_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    account_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 3. Create USER_ROLES table
  CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
  );

  -- 4. Create ORDERS table
  CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL,
    cargo_type TEXT NOT NULL,
    weight DECIMAL(10, 2),
    length DECIMAL(10, 2),
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    status order_status DEFAULT 'open' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 5. Create RESPONSES table
  CREATE TABLE public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    carrier_id TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    delivery_time TEXT,
    comment TEXT,
    is_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (order_id, carrier_id)
  );

  -- 6. Create DEALS table
  CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    carrier_id TEXT NOT NULL,
    agreed_price DECIMAL(12, 2) NOT NULL,
    status deal_status DEFAULT 'pending' NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    proof_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (order_id)
  );

  -- 7. Create MESSAGES table
  CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT messages_context_check CHECK (
      (deal_id IS NOT NULL AND order_id IS NULL) OR 
      (deal_id IS NULL AND order_id IS NOT NULL)
    )
  );

  -- 8. Create GPS_LOCATIONS table
  CREATE TABLE public.gps_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    carrier_id TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 9. Create RATINGS table
  CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    rater_id TEXT NOT NULL,
    rated_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (deal_id, rater_id)
  );

  -- 10. Create AI_CONVERSATIONS table (user_id as TEXT for Firebase)
  CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 11. Create AI_MESSAGES table
  CREATE TABLE public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 12. Create SUBSCRIPTION_PLANS table (no user dependencies)
  CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    required_role app_role,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 13. Create USER_SUBSCRIPTIONS table
  CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, plan_id)
  );

  -- 14. Create FAVORITES table
  CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    carrier_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, carrier_id)
  );

  -- 15. Create PROMO_CODES table (no user dependencies)
  CREATE TABLE public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 16. Create USER_PROMO_CODES table
  CREATE TABLE public.user_promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL
  );

  -- 17. Create KYC_VERIFICATIONS table
  CREATE TABLE public.kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    documents JSONB DEFAULT '[]'::jsonb,
    face_match_score DECIMAL(3, 2),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 18. Create LOYALTY_POINTS table
  CREATE TABLE public.loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 19. Create LOYALTY_TRANSACTIONS table
  CREATE TABLE public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    points_change INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'expired')),
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- 20. Create NOTIFICATIONS table
  CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'deal', 'message', 'system')),
    read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- =============================================
  -- Functions
  -- =============================================

  CREATE OR REPLACE FUNCTION public.get_user_role(_user_id TEXT)
  RETURNS app_role
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
  $$;

  CREATE OR REPLACE FUNCTION public.has_role(_user_id TEXT, _role app_role)
  RETURNS BOOLEAN
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
  $$;

  CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- =============================================
  -- Triggers
  -- =============================================

  CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_promo_codes_updated_at
    BEFORE UPDATE ON public.promo_codes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_kyc_verifications_updated_at
    BEFORE UPDATE ON public.kyc_verifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_loyalty_points_updated_at
    BEFORE UPDATE ON public.loyalty_points
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  -- =============================================
  -- Indexes
  -- =============================================

  CREATE INDEX idx_orders_client_id ON public.orders(client_id);
  CREATE INDEX idx_orders_status ON public.orders(status);
  CREATE INDEX idx_responses_order_id ON public.responses(order_id);
  CREATE INDEX idx_responses_carrier_id ON public.responses(carrier_id);
  CREATE INDEX idx_deals_client_id ON public.deals(client_id);
  CREATE INDEX idx_deals_carrier_id ON public.deals(carrier_id);
  CREATE INDEX idx_deals_status ON public.deals(status);
  CREATE INDEX idx_messages_deal_id ON public.messages(deal_id);
  CREATE INDEX idx_messages_order_id ON public.messages(order_id);
  CREATE INDEX idx_gps_locations_deal_id ON public.gps_locations(deal_id);
  CREATE INDEX idx_ratings_rated_id ON public.ratings(rated_id);
  CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
  CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
  CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
  CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
  CREATE INDEX idx_favorites_carrier_id ON public.favorites(carrier_id);
  CREATE INDEX idx_loyalty_points_user_id ON public.loyalty_points(user_id);
  CREATE INDEX idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
  CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
  CREATE INDEX idx_notifications_read ON public.notifications(read);
  CREATE INDEX idx_notifications_type ON public.notifications(type);

  -- =============================================
  -- Realtime
  -- =============================================

  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_locations;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;

  -- =============================================
  -- RLS Disabled for Firebase Auth
  -- =============================================

  ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ai_conversations DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ai_messages DISABLE ROW LEVEL SECURITY;

  -- =============================================
  -- Grants
  -- =============================================

  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

  -- =============================================
  -- Working Test Data
  -- =============================================

  -- 1. Subscription Plans (no dependencies)
  INSERT INTO public.subscription_plans (name, description, price, duration_days, features, required_role)
  VALUES 
    ('Basic', 'Basic plan for individuals', 10.00, 30, '["Basic support", "Up to 5 orders/month"]', 'client'),
    ('Premium', 'Premium plan for businesses', 50.00, 30, '["Priority support", "Unlimited orders", "Advanced features"]', 'client'),
    ('Carrier Pro', 'Professional plan for carriers', 30.00, 30, '["Verified badge", "Priority orders", "GPS tracking"]', 'carrier');

  -- 2. Promo Codes (no dependencies)
  INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order_value, max_uses, used_count, expires_at, is_active)
  VALUES 
    ('WELCOME10', 'percentage', 10.0, 50.0, 100, 0, NOW() + INTERVAL '30 days', true),
    ('FLAT20', 'fixed', 20.0, 100.0, 50, 0, NOW() + INTERVAL '60 days', true),
    ('SPECIAL2024', 'percentage', 15.0, 75.0, 200, 0, NOW() + INTERVAL '90 days', true);

  -- 3. Test Profiles (with Firebase UID)
  INSERT INTO public.profiles (id, user_id, full_name, email, account_status, email_verified, email_verified_at)
  VALUES 
    (gen_random_uuid(), 'uIgIpjzRKreOuhx8ixDaAeB3kNs1', 'Firebase User', 'user@example.com', 'active', true, now()),
    (gen_random_uuid(), NULL, 'Admin User', 'admin@test.com', 'active', true, now()),
    (gen_random_uuid(), NULL, 'John Client', 'client@test.com', 'active', true, now()),
    (gen_random_uuid(), NULL, 'Mike Carrier', 'carrier@test.com', 'active', true, now());

  -- 4. Test User Roles for Firebase user
  INSERT INTO public.user_roles (user_id, role)
  VALUES 
    ('uIgIpjzRKreOuhx8ixDaAeB3kNs1', 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 5. Test AI Conversation (with Firebase UID)
  INSERT INTO public.ai_conversations (id, user_id, title)
  VALUES 
    (gen_random_uuid(), 'uIgIpjzRKreOuhx8ixDaAeB3kNs1', 'Help with shipping documentation'),
    (gen_random_uuid(), NULL, 'General Help');

  -- 6. Test AI Messages
  INSERT INTO public.ai_messages (conversation_id, role, content)
  VALUES 
    ((SELECT id FROM public.ai_conversations WHERE user_id = 'uIgIpjzRKreOuhx8ixDaAeB3kNs1' LIMIT 1), 'user', 'What documents do I need for international shipping?'),
    ((SELECT id FROM public.ai_conversations WHERE user_id = 'uIgIpjzRKreOuhx8ixDaAeB3kNs1' LIMIT 1), 'assistant', 'For international shipping, you typically need: commercial invoice, packing list, bill of lading, and any required customs forms.');

  -- 7. Test Notifications (for Firebase user)
  INSERT INTO public.notifications (id, user_id, title, message, type, read, data)
  VALUES 
    (gen_random_uuid(), 'uIgIpjzRKreOuhx8ixDaAeB3kNs1', 'Welcome to Swift Ship Connect!', 'Get started with our logistics platform', 'info', false, '{"source": "system"}'),
    (gen_random_uuid(), 'uIgIpjzRKreOuhx8ixDaAeB3kNs1', 'Profile Setup', 'Complete your profile to unlock all features', 'warning', false, '{"source": "onboarding"}'),
    (gen_random_uuid(), NULL, 'System Notification', 'System maintenance scheduled', 'info', false, '{"source": "admin"}');

  -- =============================================
  -- Success Message
  -- =============================================

  SELECT 
    '🎉 Swift Ship Connect Database Created Successfully!' as status,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.subscription_plans) as plans_count,
    (SELECT COUNT(*) FROM public.promo_codes) as promo_codes_count,
    (SELECT COUNT(*) FROM public.ai_conversations) as ai_conversations_count,
    (SELECT COUNT(*) FROM public.notifications) as notifications_count,
    '✅ Ready for Firebase Auth integration!' as info;
