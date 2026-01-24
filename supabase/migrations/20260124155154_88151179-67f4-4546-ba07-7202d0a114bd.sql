-- Fix 1: Restrict profiles table to authenticated users only (prevents PII exposure)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 2: Restrict user_roles self-assignment to non-admin roles only (prevents privilege escalation)
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can insert own non-admin role"
ON public.user_roles FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('client'::app_role, 'carrier'::app_role)
);

-- Fix 3: Create missing partner_api_keys table
CREATE TABLE IF NOT EXISTS public.partner_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  request_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.partner_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
ON public.partner_api_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
ON public.partner_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
ON public.partner_api_keys FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
ON public.partner_api_keys FOR DELETE
USING (auth.uid() = user_id);

-- Fix 4: Create missing partner_webhooks table
CREATE TABLE IF NOT EXISTS public.partner_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partner_api_keys(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(partner_id)
);

ALTER TABLE public.partner_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhooks"
ON public.partner_webhooks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.partner_api_keys 
  WHERE partner_api_keys.id = partner_webhooks.partner_id 
  AND partner_api_keys.user_id = auth.uid()
));

CREATE POLICY "Users can manage own webhooks"
ON public.partner_webhooks FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.partner_api_keys 
  WHERE partner_api_keys.id = partner_webhooks.partner_id 
  AND partner_api_keys.user_id = auth.uid()
));

-- Add update trigger for partner_api_keys
CREATE TRIGGER update_partner_api_keys_updated_at
BEFORE UPDATE ON public.partner_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for partner_webhooks
CREATE TRIGGER update_partner_webhooks_updated_at
BEFORE UPDATE ON public.partner_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();