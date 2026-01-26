-- Add role column to subscription_plans table
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('client', 'carrier', 'admin'));

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_subscription_plans_role ON public.subscription_plans(role);

-- Update existing plans with role
UPDATE public.subscription_plans
SET role = 'client'
WHERE name IN ('basic', 'pro', 'enterprise') AND role IS NULL;

-- Add comment
COMMENT ON COLUMN public.subscription_plans.role IS 'Role that this subscription plan is available for';
