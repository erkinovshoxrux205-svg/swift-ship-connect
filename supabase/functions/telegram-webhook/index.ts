import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
    contact?: {
      phone_number: string;
      first_name: string;
      last_name?: string;
      user_id?: number;
    };
  };
}

// Send message via Telegram
async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    return response.ok;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if this is a Telegram webhook update
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await req.json();

      // Handle action requests from frontend
      if (body.action) {
        const { action, userId, phone } = body;

        if (action === 'get-link-code') {
          // Generate a link code for user to send to bot
          const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          // Store the link code temporarily
          await supabase.from('otp_codes').insert({
            user_id: userId,
            phone: phone || null,
            code: linkCode,
            type: 'telegram_link',
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          });

          return new Response(
            JSON.stringify({ 
              success: true, 
              linkCode,
              botUsername: 'AsiaLogBot', // Replace with your bot username
              instructions: `Отправьте код ${linkCode} нашему боту @AsiaLogBot для привязки Telegram`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (action === 'check-link-status') {
          // Check if Telegram is linked
          const { data: telegramUser } = await supabase
            .from('telegram_users')
            .select('*')
            .eq('user_id', userId)
            .single();

          return new Response(
            JSON.stringify({ 
              success: true, 
              linked: !!telegramUser,
              telegramUsername: telegramUser?.telegram_username,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Handle Telegram webhook update
      const update: TelegramUpdate = body;
      
      if (update.message) {
        const chatId = update.message.chat.id.toString();
        const text = update.message.text?.trim();
        const telegramUser = update.message.from;

        console.log(`Telegram message from ${chatId}: ${text}`);

        // Handle /start command
        if (text === '/start') {
          await sendTelegramMessage(chatId, `
🚚 <b>Добро пожаловать в AsiaLog Bot!</b>

Этот бот поможет вам:
• Получать коды подтверждения для входа
• Получать уведомления о ваших заказах
• Быстро связаться с поддержкой

Для привязки аккаунта отправьте код из приложения.
          `.trim());
          return new Response('OK', { headers: corsHeaders });
        }

        // Handle /help command
        if (text === '/help') {
          await sendTelegramMessage(chatId, `
📖 <b>Справка по боту AsiaLog</b>

<b>Команды:</b>
/start - Начать работу с ботом
/help - Показать эту справку
/status - Проверить статус аккаунта
/unlink - Отвязать аккаунт

<b>Привязка аккаунта:</b>
1. Зайдите в приложение AsiaLog
2. Перейдите в Настройки → Telegram
3. Скопируйте код привязки
4. Отправьте код в этот чат
          `.trim());
          return new Response('OK', { headers: corsHeaders });
        }

        // Handle /status command
        if (text === '/status') {
          const { data: linkedUser } = await supabase
            .from('telegram_users')
            .select('*, user_id')
            .eq('telegram_id', chatId)
            .single();

          if (linkedUser) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('user_id', linkedUser.user_id)
              .single();

            await sendTelegramMessage(chatId, `
✅ <b>Аккаунт привязан</b>

👤 Имя: ${profile?.full_name || 'Не указано'}
📱 Телефон: ${profile?.phone || 'Не указан'}
            `.trim());
          } else {
            await sendTelegramMessage(chatId, `
❌ <b>Аккаунт не привязан</b>

Отправьте код из приложения для привязки.
            `.trim());
          }
          return new Response('OK', { headers: corsHeaders });
        }

        // Handle /unlink command
        if (text === '/unlink') {
          const { error } = await supabase
            .from('telegram_users')
            .delete()
            .eq('telegram_id', chatId);

          if (!error) {
            await sendTelegramMessage(chatId, '✅ Аккаунт успешно отвязан.');
          } else {
            await sendTelegramMessage(chatId, '❌ Ошибка при отвязке аккаунта.');
          }
          return new Response('OK', { headers: corsHeaders });
        }

        // Handle shared contact (phone number)
        if (update.message.contact) {
          const phone = update.message.contact.phone_number.replace(/\D/g, '');
          
          // Try to find user by phone
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('phone', phone)
            .single();

          if (profile) {
            // Link telegram to user
            await supabase.from('telegram_users').upsert({
              user_id: profile.user_id,
              telegram_id: chatId,
              telegram_username: telegramUser.username,
              telegram_first_name: telegramUser.first_name,
              telegram_last_name: telegramUser.last_name,
              phone,
              is_verified: true,
            }, { onConflict: 'telegram_id' });

            await sendTelegramMessage(chatId, `
✅ <b>Аккаунт успешно привязан!</b>

Теперь вы будете получать:
• Коды подтверждения для входа
• Уведомления о заказах
• Важные обновления
            `.trim());
          } else {
            await sendTelegramMessage(chatId, `
❌ <b>Аккаунт не найден</b>

Пользователь с номером ${phone} не зарегистрирован.
Пожалуйста, сначала зарегистрируйтесь в приложении.
            `.trim());
          }
          return new Response('OK', { headers: corsHeaders });
        }

        // Handle link code (6-character alphanumeric)
        if (text && /^[A-Z0-9]{6}$/.test(text)) {
          const { data: otpRecord } = await supabase
            .from('otp_codes')
            .select('*')
            .eq('code', text)
            .eq('type', 'telegram_link')
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (otpRecord && otpRecord.user_id) {
            // Link telegram to user
            await supabase.from('telegram_users').upsert({
              user_id: otpRecord.user_id,
              telegram_id: chatId,
              telegram_username: telegramUser.username,
              telegram_first_name: telegramUser.first_name,
              telegram_last_name: telegramUser.last_name,
              phone: otpRecord.phone,
              is_verified: true,
            }, { onConflict: 'telegram_id' });

            // Mark code as used
            await supabase
              .from('otp_codes')
              .update({ verified: true })
              .eq('id', otpRecord.id);

            await sendTelegramMessage(chatId, `
✅ <b>Аккаунт успешно привязан!</b>

Теперь вы будете получать:
• Коды подтверждения для входа
• Уведомления о заказах
• Важные обновления

Вернитесь в приложение для продолжения.
            `.trim());

            // Log security event
            await supabase.from('security_events').insert({
              user_id: otpRecord.user_id,
              event_type: 'telegram_linked',
              severity: 'info',
              description: `Telegram account linked: @${telegramUser.username || telegramUser.first_name}`,
              metadata: { telegram_id: chatId }
            });
          } else {
            await sendTelegramMessage(chatId, `
❌ <b>Код недействителен</b>

Код не найден или истёк. Получите новый код в приложении.
            `.trim());
          }
          return new Response('OK', { headers: corsHeaders });
        }

        // Default response for unknown messages
        await sendTelegramMessage(chatId, `
🤔 Не понимаю эту команду.

Отправьте /help для списка доступных команд.
        `.trim());
      }

      return new Response('OK', { headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});