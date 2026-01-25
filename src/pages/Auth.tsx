import { useState, useEffect } from "react";
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
import { User, Truck, ArrowLeft, Loader2, Gift, Phone, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/config/brand";
import { ConfirmationResult } from "firebase/auth";

type Role = "client" | "carrier";
type AuthMethod = "email" | "phone";
type AuthView = "main" | "phone-verify" | "password-reset" | "reset-phone-verify" | "new-password";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signInWithPhone, confirmPhoneCode, sendPasswordReset, resetPasswordWithPhone, loading: authLoading } = useFirebaseAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const emailSchema = z.string().email(t("auth.invalidEmail"));
  const passwordSchema = z.string().min(6, `${t("auth.minChars")} 6 ${t("auth.chars")}`);
  const nameSchema = z.string().min(2, `${t("auth.minChars")} 2 ${t("auth.chars")}`);

  // View state
  const [view, setView] = useState<AuthView>("main");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<Role>("client");
  const [signupLoading, setSignupLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);

  // Phone verification state
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [pendingPhoneSignup, setPendingPhoneSignup] = useState(false);

  // Password reset state
  const [resetEmail, setResetEmail] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [resetMethod, setResetMethod] = useState<AuthMethod>("email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      validateReferralCode(refCode.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValid(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("referral_code", code.toUpperCase())
      .single();
    setReferralValid(!!data);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      const rest = digits.slice(3);
      let formatted = '+998';
      if (rest.length > 0) formatted += ' ' + rest.slice(0, 2);
      if (rest.length > 2) formatted += ' ' + rest.slice(2, 5);
      if (rest.length > 5) formatted += ' ' + rest.slice(5, 7);
      if (rest.length > 7) formatted += ' ' + rest.slice(7, 9);
      return formatted;
    }
    if (!digits.startsWith('998') && digits.length > 0) {
      return '+998 ' + digits.slice(0, 9);
    }
    return value;
  };

  const getE164Phone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return '+' + digits;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t("auth.validationError"),
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoginLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      let message = t("auth.loginFailed");
      if (error.message.includes("user-not-found") || error.message.includes("wrong-password")) {
        message = t("auth.invalidCredentials");
      } else if (error.message.includes("too-many-requests")) {
        message = "Слишком много попыток. Попробуйте позже";
      }
      toast({
        title: t("auth.loginError"),
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("auth.welcome"),
        description: t("auth.loginSuccess"),
      });
      navigate("/dashboard");
    }
    setLoginLoading(false);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneE164 = getE164Phone(loginPhone);
    
    if (phoneE164.length < 12) {
      toast({
        title: t("auth.validationError"),
        description: "Введите корректный номер телефона",
        variant: "destructive",
      });
      return;
    }

    setLoginLoading(true);
    const { error, confirmationResult: result } = await signInWithPhone(phoneE164, 'recaptcha-container');
    
    if (error) {
      toast({
        title: t("auth.loginError"),
        description: error.message || "Ошибка отправки SMS",
        variant: "destructive",
      });
    } else if (result) {
      setConfirmationResult(result);
      setView("phone-verify");
      toast({
        title: "SMS отправлено",
        description: "Введите код из SMS",
      });
    }
    setLoginLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!confirmationResult || otpCode.length !== 6) return;

    setVerifyLoading(true);
    const { error } = await confirmPhoneCode(confirmationResult, otpCode);
    
    if (error) {
      toast({
        title: "Неверный код",
        description: "Проверьте код и попробуйте снова",
        variant: "destructive",
      });
    } else {
      if (pendingPhoneSignup) {
        // Complete signup if this was a signup flow
        await completePhoneSignup();
      } else {
        toast({
          title: t("auth.welcome"),
          description: t("auth.loginSuccess"),
        });
        navigate("/dashboard");
      }
    }
    setVerifyLoading(false);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
      nameSchema.parse(signupName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t("auth.validationError"),
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setSignupLoading(true);
    const { error, user: newUser } = await signUp(signupEmail, signupPassword, signupRole, signupName);
    
    if (error) {
      let message = t("auth.registrationFailed");
      if (error.message.includes("email-already-in-use")) {
        message = t("auth.emailAlreadyRegistered");
      }
      toast({
        title: t("auth.registrationError"),
        description: message,
        variant: "destructive",
      });
      setSignupLoading(false);
      return;
    }

    // Handle referral
    if (referralCode && referralValid && newUser) {
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", referralCode.toUpperCase())
        .single();

      if (referrerProfile) {
        await supabase.from("referrals").insert({
          referrer_id: referrerProfile.user_id,
          referred_id: newUser.uid,
          referral_code: referralCode.toUpperCase(),
        });
      }
    }

    toast({
      title: t("auth.registrationSuccess"),
      description: t("auth.welcomeToPlatform"),
    });
    navigate("/dashboard");
    setSignupLoading(false);
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(signupName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t("auth.validationError"),
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    const phoneE164 = getE164Phone(signupPhone);
    if (phoneE164.length < 12) {
      toast({
        title: t("auth.validationError"),
        description: "Введите корректный номер телефона",
        variant: "destructive",
      });
      return;
    }

    setSignupLoading(true);
    const { error, confirmationResult: result } = await signInWithPhone(phoneE164, 'recaptcha-container');
    
    if (error) {
      toast({
        title: t("auth.registrationError"),
        description: error.message || "Ошибка отправки SMS",
        variant: "destructive",
      });
    } else if (result) {
      setConfirmationResult(result);
      setPendingPhoneSignup(true);
      setView("phone-verify");
      toast({
        title: "SMS отправлено",
        description: "Введите код из SMS для завершения регистрации",
      });
    }
    setSignupLoading(false);
  };

  const completePhoneSignup = async () => {
    // After phone auth, sync profile to Supabase
    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.uid,
          firebase_uid: user.uid,
          full_name: signupName,
          phone: user.phoneNumber?.replace(/\D/g, '') || null,
          phone_verified: true,
        });

      if (profileError) console.error("Profile error:", profileError);

      const { error: roleError } = await supabase
        .from("firebase_user_roles")
        .upsert({
          firebase_uid: user.uid,
          role: signupRole,
        });

      if (roleError) console.error("Role error:", roleError);

      toast({
        title: t("auth.registrationSuccess"),
        description: t("auth.welcomeToPlatform"),
      });
      navigate("/dashboard");
    }
  };

  const handlePasswordReset = async () => {
    if (resetMethod === "email") {
      try {
        emailSchema.parse(resetEmail);
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: t("auth.validationError"),
            description: error.errors[0].message,
            variant: "destructive",
          });
          return;
        }
      }

      setResetLoading(true);
      const { error } = await sendPasswordReset(resetEmail);
      
      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось отправить письмо. Проверьте email",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Письмо отправлено",
          description: "Проверьте вашу почту для сброса пароля",
        });
        setView("main");
      }
      setResetLoading(false);
    } else {
      const phoneE164 = getE164Phone(resetPhone);
      if (phoneE164.length < 12) {
        toast({
          title: t("auth.validationError"),
          description: "Введите корректный номер телефона",
          variant: "destructive",
        });
        return;
      }

      setResetLoading(true);
      const { error, confirmationResult: result } = await resetPasswordWithPhone(phoneE164, 'recaptcha-container');
      
      if (error) {
        toast({
          title: "Ошибка",
          description: error.message || "Ошибка отправки SMS",
          variant: "destructive",
        });
      } else if (result) {
        setConfirmationResult(result);
        setView("reset-phone-verify");
        toast({
          title: "SMS отправлено",
          description: "Введите код из SMS",
        });
      }
      setResetLoading(false);
    }
  };

  const handleResetPhoneVerify = async () => {
    if (!confirmationResult || otpCode.length !== 6) return;

    setVerifyLoading(true);
    const { error } = await confirmPhoneCode(confirmationResult, otpCode);
    
    if (error) {
      toast({
        title: "Неверный код",
        description: "Проверьте код и попробуйте снова",
        variant: "destructive",
      });
    } else {
      setView("new-password");
    }
    setVerifyLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Phone verification view
  if (view === "phone-verify" || view === "reset-phone-verify") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-customer/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-driver/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Подтверждение</CardTitle>
            <CardDescription>
              Введите 6-значный код из SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              className="w-full"
              variant="hero"
              size="lg"
              disabled={verifyLoading || otpCode.length !== 6}
              onClick={view === "reset-phone-verify" ? handleResetPhoneVerify : handleVerifyOTP}
            >
              {verifyLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                "Подтвердить"
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setView("main");
                setOtpCode("");
                setConfirmationResult(null);
                setPendingPhoneSignup(false);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </CardContent>
        </Card>

        <div id="recaptcha-container" />
      </div>
    );
  }

  // Password reset view
  if (view === "password-reset") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-customer/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-driver/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Восстановление пароля</CardTitle>
            <CardDescription>
              Выберите способ восстановления
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Method Toggle */}
            <div className="flex rounded-lg border p-1 gap-1">
              <Button
                type="button"
                variant={resetMethod === 'email' ? 'default' : 'ghost'}
                className="flex-1"
                size="sm"
                onClick={() => setResetMethod('email')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                type="button"
                variant={resetMethod === 'phone' ? 'default' : 'ghost'}
                className="flex-1"
                size="sm"
                onClick={() => setResetMethod('phone')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Телефон
              </Button>
            </div>

            {resetMethod === 'email' ? (
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="example@mail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reset-phone">Телефон</Label>
                <Input
                  id="reset-phone"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={resetPhone}
                  onChange={(e) => setResetPhone(formatPhone(e.target.value))}
                />
              </div>
            )}

            <Button
              className="w-full"
              variant="hero"
              size="lg"
              disabled={resetLoading}
              onClick={handlePasswordReset}
            >
              {resetLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                "Восстановить"
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setView("main")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к входу
            </Button>
          </CardContent>
        </Card>

        <div id="recaptcha-container" />
      </div>
    );
  }

  // New password view (after phone verification for reset)
  if (view === "new-password") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Новый пароль</CardTitle>
            <CardDescription>
              Вы успешно вошли! Теперь вы можете изменить пароль в настройках профиля.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              variant="hero"
              size="lg"
              onClick={() => navigate("/dashboard")}
            >
              Перейти в личный кабинет
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main auth view
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-customer/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-driver/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("auth.backToHome")}
        </Button>

        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{BRAND.name}</CardTitle>
            <CardDescription>{t("auth.platformDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{t("auth.loginTab")}</TabsTrigger>
                <TabsTrigger value="signup">{t("auth.registerTab")}</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={authMethod === 'email' ? handleEmailLogin : handlePhoneLogin} className="space-y-4">
                  {/* Auth Method Toggle */}
                  <div className="flex rounded-lg border p-1 gap-1">
                    <Button
                      type="button"
                      variant={authMethod === 'email' ? 'default' : 'ghost'}
                      className="flex-1"
                      size="sm"
                      onClick={() => setAuthMethod('email')}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={authMethod === 'phone' ? 'default' : 'ghost'}
                      className="flex-1"
                      size="sm"
                      onClick={() => setAuthMethod('phone')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Телефон
                    </Button>
                  </div>

                  {authMethod === 'email' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="login-email">{t("auth.email")}</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="example@mail.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">{t("auth.password")}</Label>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={() => setView("password-reset")}
                          >
                            <KeyRound className="w-3 h-3 mr-1" />
                            Забыли пароль?
                          </Button>
                        </div>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="login-phone">Телефон</Label>
                      <Input
                        id="login-phone"
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(formatPhone(e.target.value))}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Мы отправим SMS с кодом для входа
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" variant="hero" size="lg" disabled={loginLoading}>
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("auth.loggingIn")}
                      </>
                    ) : authMethod === 'email' ? (
                      t("auth.login")
                    ) : (
                      "Получить код"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup">
                <form onSubmit={authMethod === 'email' ? handleEmailSignup : handlePhoneSignup} className="space-y-4">
                  {/* Auth Method Toggle */}
                  <div className="flex rounded-lg border p-1 gap-1">
                    <Button
                      type="button"
                      variant={authMethod === 'email' ? 'default' : 'ghost'}
                      className="flex-1"
                      size="sm"
                      onClick={() => setAuthMethod('email')}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={authMethod === 'phone' ? 'default' : 'ghost'}
                      className="flex-1"
                      size="sm"
                      onClick={() => setAuthMethod('phone')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Телефон
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t("profile.name")}</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder={t("auth.namePlaceholder")}
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>

                  {authMethod === 'email' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{t("auth.email")}</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="example@mail.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{t("auth.password")}</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t("auth.passwordPlaceholder")}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Телефон</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(formatPhone(e.target.value))}
                        required
                      />
                    </div>
                  )}

                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label>{t("auth.selectRole")}</Label>
                    <RadioGroup
                      value={signupRole}
                      onValueChange={(value) => setSignupRole(value as Role)}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="role-client"
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          signupRole === "client"
                            ? "border-customer bg-customer-light"
                            : "border-border hover:border-customer/50"
                        }`}
                      >
                        <RadioGroupItem value="client" id="role-client" className="sr-only" />
                        <div className="w-12 h-12 rounded-full gradient-customer flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-medium">{t("role.client")}</span>
                        <span className="text-xs text-muted-foreground text-center">
                          {t("auth.iOrderDelivery")}
                        </span>
                      </Label>

                      <Label
                        htmlFor="role-carrier"
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          signupRole === "carrier"
                            ? "border-driver bg-driver-light"
                            : "border-border hover:border-driver/50"
                        }`}
                      >
                        <RadioGroupItem value="carrier" id="role-carrier" className="sr-only" />
                        <div className="w-12 h-12 rounded-full gradient-driver flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-medium">{t("role.carrier")}</span>
                        <span className="text-xs text-muted-foreground text-center">
                          {t("auth.iExecuteOrders")}
                        </span>
                      </Label>
                    </RadioGroup>
                  </div>

                  {/* Referral Code */}
                  <div className="space-y-2">
                    <Label htmlFor="referral-code" className="flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      {t("auth.referralCode")}
                    </Label>
                    <Input
                      id="referral-code"
                      type="text"
                      placeholder={t("auth.enterFriendCode")}
                      value={referralCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        setReferralCode(code);
                        validateReferralCode(code);
                      }}
                      className={
                        referralValid === true
                          ? "border-green-500"
                          : referralValid === false
                            ? "border-red-500"
                            : ""
                      }
                    />
                    {referralValid === true && (
                      <p className="text-xs text-green-600">✓ {t("auth.referralCodeValid")}</p>
                    )}
                    {referralValid === false && (
                      <p className="text-xs text-red-500">{t("auth.referralCodeInvalid")}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" variant="hero" size="lg" disabled={signupLoading}>
                    {signupLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("auth.registering")}
                      </>
                    ) : authMethod === 'email' ? (
                      t("auth.register")
                    ) : (
                      "Получить код"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" />
    </div>
  );
};

export default Auth;
