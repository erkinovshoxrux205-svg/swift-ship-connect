import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoyaltyEvent {
  type: "deal_delivered" | "referral_bonus" | "rating_bonus";
  user_id: string;
  amount: number;
  reason: string;
  reference_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const event: LoyaltyEvent = await req.json();
    console.log("Processing loyalty event:", event);

    // Get or create loyalty points record
    let { data: loyaltyData } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", event.user_id)
      .single();

    if (!loyaltyData) {
      const { data: newLoyalty } = await supabase
        .from("loyalty_points")
        .insert({ user_id: event.user_id, balance: 0, lifetime_earned: 0 })
        .select()
        .single();
      loyaltyData = newLoyalty;
    }

    if (!loyaltyData) {
      throw new Error("Could not create loyalty record");
    }

    // Update balance
    const newBalance = loyaltyData.balance + event.amount;
    const newLifetime = loyaltyData.lifetime_earned + event.amount;

    await supabase
      .from("loyalty_points")
      .update({ balance: newBalance, lifetime_earned: newLifetime })
      .eq("user_id", event.user_id);

    // Log transaction
    await supabase.from("loyalty_transactions").insert({
      user_id: event.user_id,
      amount: event.amount,
      type: "earned",
      reason: event.reason,
      reference_id: event.reference_id,
    });

    // Create in-app notification
    await supabase.from("notifications").insert({
      user_id: event.user_id,
      title: "Начислены баллы лояльности! 🎉",
      body: `+${event.amount} баллов: ${event.reason}`,
      type: "loyalty",
    });

    // Send push notification
    const { data: pushSubs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", event.user_id);

    if (pushSubs && pushSubs.length > 0) {
      await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          user_id: event.user_id,
          title: "Начислены баллы! 🎉",
          body: `+${event.amount} баллов: ${event.reason}`,
        }),
      });
    }

    // Send email notification
    const { data: userData } = await supabase.auth.admin.getUserById(event.user_id);
    if (userData?.user?.email) {
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: userData.user.email,
          subject: `Вам начислено ${event.amount} баллов лояльности!`,
          html: `
            <h2>🎉 Поздравляем!</h2>
            <p>Вам начислено <strong>${event.amount} баллов</strong> лояльности.</p>
            <p><strong>Причина:</strong> ${event.reason}</p>
            <p>Ваш текущий баланс: <strong>${newBalance} баллов</strong></p>
            <p>Используйте баллы для получения скидок на следующие заказы!</p>
          `,
        }),
      });
    }

    console.log(`Successfully credited ${event.amount} points to user ${event.user_id}`);

    return new Response(
      JSON.stringify({ success: true, new_balance: newBalance }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Loyalty service error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
