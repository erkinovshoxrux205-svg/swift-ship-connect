-- =============================================
-- Quick Test Script - Run this first to test
-- =============================================

-- Check if we can create a simple table
CREATE TABLE IF NOT EXISTS public.test_connection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert test data
INSERT INTO public.test_connection (message)
VALUES ('Database connection successful!')
ON CONFLICT DO NOTHING;

-- Test query
SELECT * FROM public.test_connection LIMIT 1;

-- If this works, then run the full create_schema.sql script
