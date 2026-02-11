import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXTERNAL_API_BASE = 'https://68bafc6d1e302.myxvest1.ru/checkpassword/api.php'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, phone, code, fullName, role } = await req.json()

    if (!phone) {
      return new Response(JSON.stringify({ success: false, error: 'Phone is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Clean phone - only digits
    const cleanPhone = phone.replace(/\D/g, '')

    if (action === 'send') {
      // Send OTP via external API
      const apiUrl = `${EXTERNAL_API_BASE}?action=send&phone=${cleanPhone}`
      console.log('Sending OTP to:', cleanPhone)
      
      const response = await fetch(apiUrl)
      const responseText = await response.text()
      console.log('External API response:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { raw: responseText }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Код отправлен через @asloguz бот в Telegram',
        apiResponse: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'verify') {
      if (!code) {
        return new Response(JSON.stringify({ success: false, error: 'Code is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verify OTP via external API
      const apiUrl = `${EXTERNAL_API_BASE}?action=check&phone=${cleanPhone}&code=${code}`
      console.log('Verifying OTP for:', cleanPhone)

      const response = await fetch(apiUrl)
      const responseText = await response.text()
      console.log('Verify API response:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { raw: responseText }
      }

      // Check if verification succeeded (adapt based on actual API response format)
      const isVerified = data.success === true || data.status === 'ok' || data.result === true || responseText.includes('true') || responseText.includes('success')

      if (!isVerified) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Неверный код. Попробуйте снова.',
          apiResponse: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // OTP verified - now handle user login/register
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Check if user exists by phone
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, role, email, avatar_url')
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

        // Update last login
        await supabase.from('profiles').update({
          last_login_at: new Date().toISOString(),
          phone_verified: true
        }).eq('user_id', existingProfile.user_id)

        return new Response(JSON.stringify({
          success: true,
          action: 'login',
          user: {
            id: existingProfile.user_id,
            fullName: existingProfile.full_name,
            phone: existingProfile.phone,
            role: userRole?.role || existingProfile.role || 'client',
            email: existingProfile.email,
            avatarUrl: existingProfile.avatar_url
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // New user - need registration data
      if (!fullName || !role) {
        return new Response(JSON.stringify({
          success: true,
          action: 'needs_registration',
          phone: cleanPhone,
          message: 'Телефон подтверждён. Заполните данные для регистрации.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create new user
      const userId = `tg_${cleanPhone}`
      
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          phone: cleanPhone,
          phone_verified: true,
          role: role,
          account_status: 'active',
          auth_method: 'telegram',
          referral_code: `${role === 'client' ? 'C' : 'D'}${cleanPhone.slice(-6).toUpperCase()}`
        })

      if (createError) {
        console.error('Profile creation error:', createError)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Ошибка создания профиля: ' + createError.message 
        }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        })

      if (roleError) {
        console.error('Role assignment error:', roleError)
      }

      return new Response(JSON.stringify({
        success: true,
        action: 'registered',
        user: {
          id: userId,
          fullName: fullName,
          phone: cleanPhone,
          role: role
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Telegram login error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
