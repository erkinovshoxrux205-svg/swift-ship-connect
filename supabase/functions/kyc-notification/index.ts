import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  type: "kyc_submitted" | "kyc_verified" | "kyc_rejected" | "registration_pending" | "registration_approved" | "registration_rejected";
  data?: {
    reason?: string;
    documentType?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const { userId, type, data } = await req.json() as NotificationRequest;

    console.log(`Processing ${type} notification for user ${userId}`);

    // Get user profile and email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authUser.user) {
      throw new Error(`User not found: ${userId}`);
    }

    const userEmail = authUser.user.email;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();

    const userName = profile?.full_name || "Пользователь";

    // Notification templates
    const templates: Record<string, { title: string; body: string; emailSubject: string; emailBody: string }> = {
      kyc_submitted: {
        title: "KYC документы отправлены",
        body: "Ваши документы отправлены на проверку. Ожидайте результата в течение 24 часов.",
        emailSubject: "Документы приняты на проверку - CargoConnect",
        emailBody: `
          <h1>Здравствуйте, ${userName}!</h1>
          <p>Ваши документы для верификации успешно получены и отправлены на проверку.</p>
          <p>Результат проверки будет готов в течение <strong>24 часов</strong>.</p>
          <p>Вы получите уведомление, как только проверка будет завершена.</p>
          <br>
          <p>С уважением,<br>Команда CargoConnect</p>
        `,
      },
      kyc_verified: {
        title: "KYC верификация пройдена ✓",
        body: "Поздравляем! Ваша личность подтверждена. Теперь вам доступны все функции платформы.",
        emailSubject: "Верификация пройдена! - CargoConnect",
        emailBody: `
          <h1>Поздравляем, ${userName}! 🎉</h1>
          <p>Ваша верификация успешно завершена.</p>
          <p>Теперь вам доступны все функции платформы:</p>
          <ul>
            <li>Создание и принятие заказов без ограничений</li>
            <li>Повышенный лимит сделок</li>
            <li>Приоритетная поддержка</li>
          </ul>
          <br>
          <p>С уважением,<br>Команда CargoConnect</p>
        `,
      },
      kyc_rejected: {
        title: "KYC верификация отклонена",
        body: data?.reason || "К сожалению, ваши документы не прошли проверку. Пожалуйста, загрузите документы повторно.",
        emailSubject: "Требуется повторная загрузка документов - CargoConnect",
        emailBody: `
          <h1>Здравствуйте, ${userName}</h1>
          <p>К сожалению, ваши документы не прошли проверку.</p>
          ${data?.reason ? `<p><strong>Причина:</strong> ${data.reason}</p>` : ""}
          <p>Пожалуйста, загрузите документы повторно, убедившись, что:</p>
          <ul>
            <li>Документ читаемый и не размыт</li>
            <li>Все данные видны полностью</li>
            <li>Селфи соответствует фото в документе</li>
          </ul>
          <br>
          <p>С уважением,<br>Команда CargoConnect</p>
        `,
      },
      registration_pending: {
        title: "Заявка на регистрацию отправлена",
        body: "Ваша заявка отправлена на рассмотрение. Мы свяжемся с вами в ближайшее время.",
        emailSubject: "Заявка на регистрацию получена - CargoConnect",
        emailBody: `
          <h1>Здравствуйте, ${userName}!</h1>
          <p>Ваша заявка на регистрацию в системе CargoConnect получена.</p>
          <p>Наша команда рассмотрит её в течение <strong>1-2 рабочих дней</strong>.</p>
          <p>Вы получите уведомление о результате рассмотрения.</p>
          <br>
          <p>С уважением,<br>Команда CargoConnect</p>
        `,
      },
      registration_approved: {
        title: "Регистрация одобрена ✓",
        body: "Ваша регистрация одобрена! Добро пожаловать в CargoConnect.",
        emailSubject: "Добро пожаловать в CargoConnect! 🚚",
        emailBody: `
          <h1>Добро пожаловать, ${userName}! 🎉</h1>
          <p>Ваша регистрация успешно одобрена.</p>
          <p>Теперь вы можете войти в систему и начать использовать все возможности платформы.</p>
          <p><a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/auth">Войти в систему</a></p>
          <br>
          <p>С уважением,<br>Команда CargoConnect</p>
        `,
      },
      registration_rejected: {
        title: "Регистрация отклонена",
        body: data?.reason || "К сожалению, ваша заявка на регистрацию отклонена.",
        emailSubject: "Статус регистрации - CargoConnect",
        emailBody: `
          <h1>Здравствуйте, ${userName}</h1>
          <p>К сожалению, ваша заявка на регистрацию отклонена.</p>
          ${data?.reason ? `<p><strong>Причина:</strong> ${data.reason}</p>` : ""}
          <p>Если у вас есть вопросы, пожалуйста, свяжитесь с нашей поддержкой.</p>
          <br>
          <p>С уважением,<br>Команда CargoConnect</p>
        `,
      },
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    // 1. Create in-app notification
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: userId,
      title: template.title,
      body: template.body,
      type: type.startsWith("kyc_") ? "kyc" : "registration",
      is_read: false,
    });

    if (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    // 2. Send push notification
    try {
      const pushResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            userId,
            title: template.title,
            body: template.body,
            url: "/profile",
            tag: type,
          }),
        }
      );

      if (!pushResponse.ok) {
        console.log("Push notification not sent (user may not have subscribed)");
      }
    } catch (pushError) {
      console.log("Push notification error:", pushError);
    }

    // 3. Send email notification via send-email function
    if (resendApiKey && userEmail) {
      try {
        await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              to: userEmail,
              subject: template.emailSubject,
              html: template.emailBody,
            }),
          }
        );
        console.log(`Email sent to ${userEmail}`);
      } catch (emailError) {
        console.error("Email error:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, type, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("KYC notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
