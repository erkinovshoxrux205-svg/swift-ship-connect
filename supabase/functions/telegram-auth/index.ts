import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

// SHA-256 hash function for code storage
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + 'telegram_auth_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Normalize phone number to +998XXXXXXXXX format
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('998')) {
    return '+' + cleaned;
  }
  if (cleaned.length === 9) {
    return '+998' + cleaned;
  }
  return '+' + cleaned;
}

// Send message via Telegram Bot
async function sendTelegramMessage(chatId: string | number, text: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });
    const result = await response.json();
    console.log('Telegram send result:', result);
    return result.ok === true;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, phone, code, telegram_id } = await req.json();

    console.log(`[telegram-auth] Action: ${action}, Phone: ${phone}`);

    // ============================================
    // ACTION: send - Generate and send OTP via Telegram
    // ============================================
    if (action === 'send') {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'Phone number required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const normalizedPhone = normalizePhone(phone);

      // Check rate limiting (max 5 attempts per hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('telegram_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('phone', normalizedPhone)
        .gte('created_at', oneHourAgo);

      if (count && count >= 5) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Слишком много попыток. Подождите час.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      // Find telegram_id linked to this phone in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('phone', normalizedPhone)
        .single();

      if (!profile?.telegram_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Телефон не привязан к Telegram. Напишите боту /start',
            need_telegram_link: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Generate OTP and hash it
      const otp = generateOTP();
      const codeHash = await hashCode(otp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Delete old verifications for this phone
      await supabase
        .from('telegram_verifications')
        .delete()
        .eq('phone', normalizedPhone);

      // Insert new verification record
      const { error: insertError } = await supabase
        .from('telegram_verifications')
        .insert({
          phone: normalizedPhone,
          code_hash: codeHash,
          expires_at: expiresAt.toISOString(),
          telegram_id: profile.telegram_id,
          attempts: 0,
          verified: false
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create verification' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Send OTP via Telegram
      const message = `🔐 <b>Код подтверждения AsiaLog</b>\n\n` +
        `Ваш код: <code>${otp}</code>\n\n` +
        `⏰ Действителен 5 минут\n` +
        `⚠️ Никому не сообщайте этот код!`;

      const sent = await sendTelegramMessage(profile.telegram_id, message);

      if (!sent) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to send Telegram message' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`[telegram-auth] OTP sent to ${normalizedPhone} via Telegram`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Код отправлен в Telegram',
          expires_at: expiresAt.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: verify - Verify the OTP code
    // ============================================
    if (action === 'verify') {
      if (!phone || !code) {
        return new Response(
          JSON.stringify({ success: false, error: 'Phone and code required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const normalizedPhone = normalizePhone(phone);
      const codeHash = await hashCode(code);

      // Find verification record
      const { data: verification, error: findError } = await supabase
        .from('telegram_verifications')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findError || !verification) {
        return new Response(
          JSON.stringify({ success: false, error: 'Код не найден или истёк' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check max attempts
      if (verification.attempts >= 5) {
        return new Response(
          JSON.stringify({ success: false, error: 'Превышено количество попыток' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Verify code hash
      if (verification.code_hash !== codeHash) {
        // Increment attempts
        await supabase
          .from('telegram_verifications')
          .update({ attempts: verification.attempts + 1 })
          .eq('id', verification.id);

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Неверный код',
            attempts_left: 4 - verification.attempts
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Mark as verified
      await supabase
        .from('telegram_verifications')
        .update({ verified: true })
        .eq('id', verification.id);

      // Update profile phone_verified
      await supabase
        .from('profiles')
        .update({ 
          phone_verified: true,
          phone: normalizedPhone 
        })
        .eq('telegram_id', verification.telegram_id);

      console.log(`[telegram-auth] Phone ${normalizedPhone} verified successfully`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Телефон подтверждён',
          telegram_id: verification.telegram_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: link - Link Telegram ID to phone (called from bot webhook)
    // ============================================
    if (action === 'link') {
      if (!phone || !telegram_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Phone and telegram_id required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const normalizedPhone = normalizePhone(phone);

      // Update or create profile with telegram_id
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({ 
            telegram_id,
            telegram_verified: true,
            telegram_verified_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);
      } else {
        // Create new profile if not exists
        await supabase
          .from('profiles')
          .insert({
            phone: normalizedPhone,
            telegram_id,
            telegram_verified: true,
            telegram_verified_at: new Date().toISOString(),
            user_id: crypto.randomUUID() // Temporary ID until full registration
          });
      }

      console.log(`[telegram-auth] Linked phone ${normalizedPhone} to Telegram ID ${telegram_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Telegram привязан к номеру телефона'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: status - Check verification status
    // ============================================
    if (action === 'status') {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'Phone required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const normalizedPhone = normalizePhone(phone);

      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_id, telegram_verified, phone_verified')
        .eq('phone', normalizedPhone)
        .single();

      return new Response(
        JSON.stringify({ 
          success: true,
          has_telegram: !!profile?.telegram_id,
          telegram_verified: profile?.telegram_verified || false,
          phone_verified: profile?.phone_verified || false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: unknown) {
    console.error('[telegram-auth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});