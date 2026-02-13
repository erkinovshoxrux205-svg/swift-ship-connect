import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXTERNAL_API_BASE = 'https://68bafc6d1e302.myxvest1.ru/checkpassword/api.php'

// Rate limiting constants
const SEND_COOLDOWN_SECONDS = 60
const MAX_SENDS_PER_HOUR = 5
const MAX_VERIFY_ATTEMPTS = 3
const BLOCK_DURATION_MINUTES = 15
const OTP_SESSION_TTL_MINUTES = 10

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('998') && digits.length === 12) return digits
  if (!digits.startsWith('998') && digits.length === 9) return '998' + digits
  return digits
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const { action, phone, code, fullName, role, verifiedToken } = await req.json()

    if (!phone) return json({ success: false, error: 'Phone is required' }, 400)

    const cleanPhone = normalizePhone(phone)
    if (cleanPhone.length !== 12 || !cleanPhone.startsWith('998')) {
      return json({ success: false, error: 'Неверный формат номера. Используйте +998XXXXXXXXX' }, 400)
    }

    const supabase = getSupabase()

    // ─── ACTION: SEND OTP ───────────────────────────────────────────────
    if (action === 'send') {
      // Rate limiting: check if phone is blocked
      const { data: recentAttempts } = await supabase
        .from('otp_codes')
        .select('id, created_at, attempts')
        .eq('phone', cleanPhone)
        .eq('type', 'telegram_login')
        .gte('created_at', new Date(Date.now() - BLOCK_DURATION_MINUTES * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      // Check if blocked due to max attempts
      if (recentAttempts?.[0]?.attempts >= MAX_VERIFY_ATTEMPTS) {
        const blockedUntil = new Date(new Date(recentAttempts[0].created_at).getTime() + BLOCK_DURATION_MINUTES * 60 * 1000)
        const remainingMs = blockedUntil.getTime() - Date.now()
        if (remainingMs > 0) {
          return json({
            success: false,
            error: `Номер заблокирован. Попробуйте через ${Math.ceil(remainingMs / 60000)} мин.`,
            blockedUntil: blockedUntil.toISOString(),
          }, 429)
        }
      }

      // Rate limit: cooldown between sends
      const { data: lastSend } = await supabase
        .from('otp_codes')
        .select('created_at')
        .eq('phone', cleanPhone)
        .eq('type', 'telegram_login')
        .order('created_at', { ascending: false })
        .limit(1)

      if (lastSend?.[0]) {
        const elapsed = (Date.now() - new Date(lastSend[0].created_at).getTime()) / 1000
        if (elapsed < SEND_COOLDOWN_SECONDS) {
          return json({
            success: false,
            error: `Подождите ${Math.ceil(SEND_COOLDOWN_SECONDS - elapsed)} сек. перед повторной отправкой`,
            retryAfter: Math.ceil(SEND_COOLDOWN_SECONDS - elapsed),
          }, 429)
        }
      }

      // Rate limit: max sends per hour
      const { count: sendsInHour } = await supabase
        .from('otp_codes')
        .select('*', { count: 'exact', head: true })
        .eq('phone', cleanPhone)
        .eq('type', 'telegram_login')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())

      if ((sendsInHour || 0) >= MAX_SENDS_PER_HOUR) {
        return json({
          success: false,
          error: 'Превышен лимит отправок. Попробуйте через час.',
        }, 429)
      }

      // Call external API to send OTP
      const apiUrl = `${EXTERNAL_API_BASE}?action=send&phone=${cleanPhone}`
      const response = await fetch(apiUrl)
      const responseText = await response.text()

      // Store OTP record (we don't know the code - it's external)
      await supabase.from('otp_codes').insert({
        phone: cleanPhone,
        code: '___SERVER___', // We don't know the code, external service manages it
        type: 'telegram_login',
        expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // 3 min
        attempts: 0,
        max_attempts: MAX_VERIFY_ATTEMPTS,
      })

      return json({
        success: true,
        message: 'Код отправлен через @asloguz бот в Telegram',
        cooldown: SEND_COOLDOWN_SECONDS,
        expiresIn: 180, // 3 minutes
      })
    }

    // ─── ACTION: VERIFY OTP ─────────────────────────────────────────────
    if (action === 'verify') {
      if (!code || typeof code !== 'string' || code.length < 4 || code.length > 6) {
        return json({ success: false, error: 'Введите корректный код' }, 400)
      }

      // Get latest OTP record for rate limiting
      const { data: otpRecord } = await supabase
        .from('otp_codes')
        .select('id, attempts, max_attempts, expires_at, created_at')
        .eq('phone', cleanPhone)
        .eq('type', 'telegram_login')
        .order('created_at', { ascending: false })
        .limit(1)

      if (!otpRecord?.[0]) {
        return json({ success: false, error: 'Сначала запросите код' }, 400)
      }

      const record = otpRecord[0]

      // Check if expired
      if (new Date(record.expires_at) < new Date()) {
        return json({ success: false, error: 'Код истёк. Запросите новый.' }, 400)
      }

      // Check attempts
      if (record.attempts >= (record.max_attempts || MAX_VERIFY_ATTEMPTS)) {
        return json({
          success: false,
          error: `Превышено число попыток (${MAX_VERIFY_ATTEMPTS}). Запросите новый код через ${BLOCK_DURATION_MINUTES} мин.`,
          blocked: true,
        }, 429)
      }

      // Increment attempts BEFORE checking with external API
      await supabase
        .from('otp_codes')
        .update({ attempts: record.attempts + 1, updated_at: new Date().toISOString() })
        .eq('id', record.id)

      // Verify with external API
      const apiUrl = `${EXTERNAL_API_BASE}?action=check&phone=${cleanPhone}&code=${code}`
      const response = await fetch(apiUrl)
      const responseText = await response.text()

      let data: any
      try { data = JSON.parse(responseText) } catch { data = { raw: responseText } }

      const isVerified = data.success === true || data.status === 'ok' || data.result === true || 
                         responseText.includes('true') || responseText.includes('success')

      if (!isVerified) {
        const remaining = (record.max_attempts || MAX_VERIFY_ATTEMPTS) - (record.attempts + 1)
        return json({
          success: false,
          error: remaining > 0
            ? `Неверный код. Осталось попыток: ${remaining}`
            : `Неверный код. Попытки исчерпаны. Запросите новый код через ${BLOCK_DURATION_MINUTES} мин.`,
          attemptsRemaining: remaining,
          blocked: remaining <= 0,
        })
      }

      // ✅ OTP VERIFIED - mark as verified
      await supabase
        .from('otp_codes')
        .update({ verified: true, updated_at: new Date().toISOString() })
        .eq('id', record.id)

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, role, email, avatar_url, account_status')
        .eq('phone', cleanPhone)
        .single()

      if (existingProfile) {
        // Existing user - login
        // Get their role
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', existingProfile.user_id)
          .single()

        await supabase.from('profiles').update({
          last_login_at: new Date().toISOString(),
          phone_verified: true,
        }).eq('user_id', existingProfile.user_id)

        // Generate a session token
        const sessionToken = crypto.randomUUID()
        
        // Store session in otp_codes as a session marker
        await supabase.from('otp_codes').insert({
          phone: cleanPhone,
          code: sessionToken,
          type: 'telegram_session',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          user_id: existingProfile.user_id,
          verified: true,
        })

        return json({
          success: true,
          action: 'login',
          sessionToken,
          user: {
            id: existingProfile.user_id,
            fullName: existingProfile.full_name,
            phone: existingProfile.phone,
            role: userRole?.role || existingProfile.role || 'client',
            email: existingProfile.email,
            avatarUrl: existingProfile.avatar_url,
            provider: 'telegram',
          },
        })
      }

      // NEW USER → needs registration
      // Create a temporary verified session token (10 min TTL)
      const verifiedToken = crypto.randomUUID()
      await supabase.from('otp_codes').insert({
        phone: cleanPhone,
        code: verifiedToken,
        type: 'telegram_verified_phone',
        expires_at: new Date(Date.now() + OTP_SESSION_TTL_MINUTES * 60 * 1000).toISOString(),
        verified: true,
      })

      return json({
        success: true,
        action: 'needs_registration',
        verifiedToken,
        phone: cleanPhone,
        message: 'Телефон подтверждён. Заполните данные для регистрации.',
      })
    }

    // ─── ACTION: REGISTER ───────────────────────────────────────────────
    if (action === 'register') {
      if (!fullName || !role) {
        return json({ success: false, error: 'Имя и роль обязательны' }, 400)
      }

      if (!['client', 'carrier'].includes(role)) {
        return json({ success: false, error: 'Недопустимая роль' }, 400)
      }

      if (fullName.length < 2 || fullName.length > 100) {
        return json({ success: false, error: 'Имя должно быть от 2 до 100 символов' }, 400)
      }

      // Check verified phone session
      const { data: verifiedSession } = await supabase
        .from('otp_codes')
        .select('id, phone, expires_at')
        .eq('phone', cleanPhone)
        .eq('type', 'telegram_verified_phone')
        .eq('verified', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      if (!verifiedSession?.[0]) {
        return json({ success: false, error: 'Сессия верификации истекла. Запросите код повторно.' }, 400)
      }

      // Check if user already exists by this phone
      const { data: existingByPhone } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', cleanPhone)
        .single()

      if (existingByPhone) {
        return json({ success: false, error: 'Пользователь с этим номером уже зарегистрирован' }, 409)
      }

      // Create user
      const userId = `tg_${cleanPhone}`

      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: fullName.trim(),
          phone: cleanPhone,
          phone_verified: true,
          role: role,
          account_status: 'active',
          auth_method: 'telegram',
          referral_code: `${role === 'client' ? 'C' : 'D'}${cleanPhone.slice(-6).toUpperCase()}`,
        })

      if (createError) {
        console.error('Profile creation error:', createError)
        return json({ success: false, error: 'Ошибка создания профиля' }, 500)
      }

      // Assign role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role })

      if (roleError) {
        console.error('Role assignment error:', roleError)
      }

      // Invalidate the verified phone session
      await supabase
        .from('otp_codes')
        .delete()
        .eq('id', verifiedSession[0].id)

      // Create session token
      const sessionToken = crypto.randomUUID()
      await supabase.from('otp_codes').insert({
        phone: cleanPhone,
        code: sessionToken,
        type: 'telegram_session',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: userId,
        verified: true,
      })

      return json({
        success: true,
        action: 'registered',
        sessionToken,
        user: {
          id: userId,
          fullName: fullName.trim(),
          phone: cleanPhone,
          role: role,
          provider: 'telegram',
        },
      })
    }

    // ─── ACTION: VALIDATE SESSION ───────────────────────────────────────
    if (action === 'validate_session') {
      const bodyData = { phone, code } // code = sessionToken in this case
      
      if (!code) {
        return json({ success: false, error: 'Session token required' }, 400)
      }

      const { data: session } = await supabase
        .from('otp_codes')
        .select('phone, user_id, expires_at')
        .eq('code', code)
        .eq('type', 'telegram_session')
        .eq('verified', true)
        .gte('expires_at', new Date().toISOString())
        .single()

      if (!session) {
        return json({ success: false, error: 'Invalid or expired session' }, 401)
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, role, email, avatar_url, account_status')
        .eq('user_id', session.user_id)
        .single()

      if (!profile) {
        return json({ success: false, error: 'User not found' }, 404)
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.user_id)
        .single()

      return json({
        success: true,
        user: {
          id: profile.user_id,
          fullName: profile.full_name,
          phone: profile.phone,
          role: userRole?.role || profile.role || 'client',
          email: profile.email,
          avatarUrl: profile.avatar_url,
          provider: 'telegram',
        },
      })
    }

    // ─── ACTION: LOGOUT ─────────────────────────────────────────────────
    if (action === 'logout') {
      if (code) {
        // code = sessionToken
        await supabase
          .from('otp_codes')
          .delete()
          .eq('code', code)
          .eq('type', 'telegram_session')
      }
      return json({ success: true })
    }

    return json({ success: false, error: 'Invalid action' }, 400)
  } catch (error: any) {
    console.error('Telegram login error:', error)
    return json({ success: false, error: 'Internal server error' }, 500)
  }
})
