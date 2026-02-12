-- =============================================
-- Fix Firebase User Integration
-- Execute this after ONE_SCRIPT_TO_RULE_THEM_ALL.sql
-- =============================================

-- Create a function to handle Firebase user IDs
CREATE OR REPLACE FUNCTION public.create_profile_from_firebase(
  firebase_uid TEXT,
  email TEXT DEFAULT NULL,
  full_name TEXT DEFAULT NULL,
  role app_role DEFAULT 'client'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_uuid UUID;
  user_uuid UUID;
BEGIN
  -- Generate a proper UUID for the user_id field
  user_uuid := gen_random_uuid();
  
  -- Create profile with the generated UUID as user_id
  INSERT INTO public.profiles (user_id, full_name, email, account_status, email_verified, email_verified_at)
  VALUES (user_uuid, full_name, email, 'active', true, now())
  RETURNING id INTO profile_uuid;
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_uuid, role);
  
  -- Return the profile UUID
  RETURN profile_uuid;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, return existing ID
    SELECT id INTO profile_uuid FROM public.profiles WHERE user_id = user_uuid;
    RETURN profile_uuid;
END;
$$;

-- Create profile for the current Firebase user
SELECT public.create_profile_from_firebase(
  'uIgIpjzRKreOuhx8ixDaAeB3kNs1',
  'user@example.com',
  'Firebase User',
  'client'
) as profile_id;

-- Create some test notifications for this user
INSERT INTO public.notifications (user_id, title, message, type, read, data)
VALUES 
  ((SELECT user_id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1), 
   'Welcome Back!', 'You have successfully logged in', 'success', false, '{"source": "auth"}'),
  ((SELECT user_id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1), 
   'New Features', 'Check out our latest logistics features', 'info', false, '{"source": "system"}');

-- Create AI conversation for this user
INSERT INTO public.ai_conversations (user_id, title)
VALUES 
  ((SELECT user_id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1), 
   'Welcome Conversation');

-- Add AI messages
INSERT INTO public.ai_messages (conversation_id, role, content)
VALUES 
  ((SELECT id FROM public.ai_conversations WHERE user_id = (SELECT user_id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1) LIMIT 1), 
   'user', 'Hello, I need help with shipping'),
  ((SELECT id FROM public.ai_conversations WHERE user_id = (SELECT user_id FROM public.profiles WHERE email = 'user@example.com' LIMIT 1) LIMIT 1), 
   'assistant', 'Hello! I can help you with all your shipping needs. What would you like to know?');

-- Success message
SELECT 
  '✅ Firebase User Integration Fixed!' as status,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.notifications) as total_notifications,
  (SELECT COUNT(*) FROM public.ai_conversations) as total_ai_conversations,
  '🎉 Ready for Firebase Auth!' as info;
