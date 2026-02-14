import { useState, useEffect } from "react";
import { Share2, Users, Gift, Copy, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Referral {
  id: string;
  referred_id: string;
  bonus_paid: boolean;
  created_at: string;
  referred_profile?: {
    full_name: string | null;
  };
}

export const ReferralCard = () => {
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      // Load user's referral code
      const { data: profileData } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user.uid)
        .single();

      if (profileData?.referral_code) {
        setReferralCode(profileData.referral_code);
      }

      // Load referrals
      const { data: referralsData } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.uid)
        .order("created_at", { ascending: false });

      if (referralsData) {
        // Get referred profiles
        const referredIds = referralsData.map((r) => r.referred_id);
        if (referredIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", referredIds);

          const profilesMap = new Map(
            profilesData?.map((p) => [p.user_id, p]) || []
          );

          const referralsWithProfiles = referralsData.map((r) => ({
            ...r,
            referred_profile: profilesMap.get(r.referred_id),
          }));

          setReferrals(referralsWithProfiles);
        } else {
          setReferrals(referralsData);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [user]);

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({ title: "Код скопирован!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Ссылка скопирована!" });
  };

  const paidCount = referrals.filter((r) => r.bonus_paid).length;
  const pendingCount = referrals.filter((r) => !r.bonus_paid).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Users className="w-5 h-5 text-primary" />
          </div>
          Реферальная программа
        </CardTitle>
        <CardDescription>
          Приглашайте друзей и получайте 200 баллов за каждого!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code */}
        {referralCode && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Ваш реферальный код</label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg tracking-widest text-center"
              />
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Share Button */}
        <Button className="w-full" onClick={shareLink}>
          <Share2 className="w-4 h-4 mr-2" />
          Поделиться ссылкой
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{paidCount}</div>
            <div className="text-xs text-muted-foreground">
              Начислено бонусов
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-muted-foreground">
              {pendingCount}
            </div>
            <div className="text-xs text-muted-foreground">
              Ожидают доставки
            </div>
          </div>
        </div>

        {/* Referrals List */}
        {referrals.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-sm font-medium">Ваши приглашённые</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm">
                    {ref.referred_profile?.full_name || "Пользователь"}
                  </span>
                  <Badge variant={ref.bonus_paid ? "default" : "secondary"}>
                    {ref.bonus_paid ? (
                      <>
                        <Gift className="w-3 h-3 mr-1" />
                        +200
                      </>
                    ) : (
                      "Ожидание"
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <p className="font-medium mb-1">Как это работает:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Отправьте ссылку другу</li>
            <li>Друг регистрируется с вашим кодом</li>
            <li>После первой завершённой доставки вы получаете 200 баллов</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
