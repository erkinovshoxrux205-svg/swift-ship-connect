import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { User, Truck, ArrowLeft, Loader2, Gift, Phone, Mail, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/config/brand";
import { ConfirmationResult } from "@/lib/firebase";

type Role = "client" | "carrier";
type AuthMethod = "email" | "phone";
type AuthView = "login" | "signup" | "reset" | "phone-verify";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPhoneCode,
    verifyPhoneCode,
    sendPasswordReset,
    loading: authLoading,
  } = useFirebaseAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  // --- Schemas ---
  const emailSchema = z.string().email(t("auth.invalidEmail"));
  const passwordSchema = z.string().min(6, `${t("auth.minChars")} 6`);

  // --- States ---
  const [authView, setAuthView] = useState<AuthView>("login");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<Role>("client");
  const [signupLoading, setSignupLoading] = useState(false);

  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);

  const [phoneOtp, setPhoneOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role>("client");

  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      const code = refCode.toUpperCase();
      setReferralCode(code);
      validateReferralCode(code);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  // Чистка Recaptcha при размонтировании или смене вида
  useEffect(() => {
    return () => {
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (recaptchaContainer) recaptchaContainer.innerHTML = "";
    };
  }, [authView, authMethod]);

  // --- Helpers ---
  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValid(null);
      return;
    }
    try {
      const { data, error } = await supabase.from("profiles").select("user_id").eq("referral_code", code).maybeSingle();
      setReferralValid(!!data && !error);
    } catch {
      setReferralValid(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";

    // Логика для Узбекистана
    let res = digits;
    if (res.startsWith("998")) res = res.slice(3);
    res = res.slice(0, 9); // Максимум 9 цифр после кода страны

    let formatted = "+998";
    if (res.length > 0) formatted += " " + res.slice(0, 2);
    if (res.length > 2) formatted += " " + res.slice(2, 5);
    if (res.length > 5) formatted += " " + res.slice(5, 7);
    if (res.length > 7) formatted += " " + res.slice(7, 9);
    return formatted;
  };

  const getFirebaseErrorMessage = (code: string) => {
    const errors: Record<string, string> = {
      "auth/user-not-found": "Пользователь не найден",
      "auth/wrong-password": "Неверный пароль",
      "auth/email-already-in-use": "Этот Email уже зарегистрирован",
      "auth/invalid-verification-code": "Неверный код из СМС",
      "auth/too-many-requests": "Слишком много попыток. Попробуйте позже",
      "auth/network-request-failed": "Ошибка сети. Проверьте соединение",
    };
    return errors[code] || "Произошла непредвиденная ошибка";
  };

  // --- Handlers ---
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);

      const { error } = await signInWithEmail(loginEmail, loginPassword);
      if (error) throw error;

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error instanceof z.ZodError ? error.errors[0].message : getFirebaseErrorMessage(error.code),
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePhoneAuth = async (phone: string, role: Role) => {
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 12) {
      toast({ title: "Ошибка", description: "Введите полный номер телефона", variant: "destructive" });
      return;
    }

    setLoginLoading(true);
    setSignupLoading(true);
    setPendingRole(role);

    try {
      const { error, confirmationResult: result } = await sendPhoneCode("+" + phoneDigits, "recaptcha-container");
      if (error) throw error;
      if (result) {
        setConfirmationResult(result);
        setAuthView("phone-verify");
      }
    } catch (error: any) {
      toast({
        title: "Ошибка СМС",
        description: getFirebaseErrorMessage(error.code),
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
      setSignupLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!confirmationResult || phoneOtp.length !== 6) return;

    setPhoneVerifyLoading(true);
    try {
      const { error } = await verifyPhoneCode(confirmationResult, phoneOtp, pendingRole);
      if (error) throw error;
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Ошибка кода",
        description: getFirebaseErrorMessage(error.code),
        variant: "destructive",
      });
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Views ---
  if (authView === "reset") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button variant="ghost" onClick={() => setAuthView("login")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Восстановление пароля</CardTitle>
            </CardHeader>
            <CardContent>
              {resetSent ? (
                <div className="text-center space-y-4">
                  <Mail className="w-12 h-12 mx-auto text-green-500" />
                  <p>Инструкции отправлены на {resetEmail}</p>
                  <Button className="w-full" onClick={() => setAuthView("login")}>
                    Ок
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setResetLoading(true);
                    const { error } = await sendPasswordReset(resetEmail);
                    if (!error) setResetSent(true);
                    setResetLoading(false);
                  }}
                  className="space-y-4"
                >
                  <Input
                    type="email"
                    placeholder="Email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  <Button className="w-full" disabled={resetLoading}>
                    {resetLoading ? <Loader2 className="animate-spin" /> : "Отправить ссылку"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-xl border-t-4 border-t-primary">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{BRAND.name}</CardTitle>
            <CardDescription>Вход в систему логистики</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" onValueChange={() => setPhoneOtp("")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="signup">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                {/* Переключатель Email/Phone */}
                <div className="flex p-1 bg-muted rounded-md">
                  <Button
                    variant={authMethod === "email" ? "secondary" : "ghost"}
                    className="flex-1"
                    onClick={() => setAuthMethod("email")}
                  >
                    Email
                  </Button>
                  <Button
                    variant={authMethod === "phone" ? "secondary" : "ghost"}
                    className="flex-1"
                    onClick={() => setAuthMethod("phone")}
                  >
                    Телефон
                  </Button>
                </div>

                {authMethod === "email" ? (
                  <form onSubmit={handleEmailLogin} className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Пароль"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <Button className="w-full" disabled={loginLoading}>
                      {loginLoading && <Loader2 className="mr-2 animate-spin" />} Войти
                    </Button>
                    <Button variant="link" className="w-full text-xs" onClick={() => setAuthView("reset")}>
                      Забыли пароль?
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <Input
                      type="tel"
                      placeholder="+998 __ ___ __ __"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(formatPhone(e.target.value))}
                    />
                    <Button
                      className="w-full"
                      onClick={() => handlePhoneAuth(loginPhone, "client")}
                      disabled={loginLoading}
                    >
                      Получить код
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Аналогично для Signup... */}
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Или через</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => signInWithGoogle(signupRole)}>
              Google
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Модалка OTP (Phone Verify View) */}
      {authView === "phone-verify" && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <CardTitle>Код из СМС</CardTitle>
              <CardDescription>Мы отправили код на ваш номер</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={phoneOtp} onChange={setPhoneOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                className="w-full"
                onClick={handleVerifyPhoneCode}
                disabled={phoneOtp.length < 6 || phoneVerifyLoading}
              >
                {phoneVerifyLoading ? <Loader2 className="animate-spin" /> : "Подтвердить"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setAuthView("login")}>
                Отмена
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Auth;
