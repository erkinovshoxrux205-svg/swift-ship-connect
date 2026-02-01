-- Create telegram_verifications table for phone verification via Telegram
CREATE TABLE IF NOT EXISTS public.telegram_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  code_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  telegram_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_verifications_phone ON public.telegram_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_telegram_verifications_telegram_id ON public.telegram_verifications(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_verifications_expires ON public.telegram_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.telegram_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies - only edge functions (service role) can access this table
-- No direct client access allowed
CREATE POLICY "Service role full access" ON public.telegram_verifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.telegram_verifications IS 'Stores phone verification codes sent via Telegram bot. Codes are hashed for security.';