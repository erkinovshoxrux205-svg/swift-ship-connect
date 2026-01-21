-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send notification via edge function
CREATE OR REPLACE FUNCTION public.notify_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  notification_type TEXT;
  payload JSONB;
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get Supabase URL from environment (set via vault)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Determine notification type based on table
  IF TG_TABLE_NAME = 'messages' THEN
    notification_type := 'message';
    payload := jsonb_build_object('type', notification_type, 'record', to_jsonb(NEW));
  ELSIF TG_TABLE_NAME = 'responses' THEN
    notification_type := 'response';
    payload := jsonb_build_object('type', notification_type, 'record', to_jsonb(NEW));
  ELSIF TG_TABLE_NAME = 'deals' THEN
    notification_type := 'deal_status';
    payload := jsonb_build_object(
      'type', notification_type, 
      'record', to_jsonb(NEW) || jsonb_build_object('old_status', OLD.status)
    );
  END IF;

  -- Make async HTTP request to edge function using pg_net
  PERFORM extensions.http_post(
    url := 'https://eqrzodfukdnwsogjzmoz.supabase.co/functions/v1/notification-trigger',
    body := payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnpvZGZ1a2Rud3NvZ2p6bW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTIyNDcsImV4cCI6MjA4NDU4ODI0N30.H9qXvIFbwcGBlpEWfJjXQ4VV46ykZmrJelMxK-UL_ZY'
    )::jsonb
  );

  RETURN NEW;
END;
$$;

-- Trigger for new messages (only non-system messages)
CREATE TRIGGER trigger_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW
WHEN (NEW.is_system IS NOT TRUE)
EXECUTE FUNCTION public.notify_push_notification();

-- Trigger for new responses
CREATE TRIGGER trigger_response_notification
AFTER INSERT ON public.responses
FOR EACH ROW
EXECUTE FUNCTION public.notify_push_notification();

-- Trigger for deal status changes
CREATE TRIGGER trigger_deal_status_notification
AFTER UPDATE OF status ON public.deals
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_push_notification();