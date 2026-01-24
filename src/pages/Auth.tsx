import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/contexts/useFirebaseAuth";
import { BRAND } from "@/constants/brand";
import { Mail, Phone, KeyRound, Eye, EyeOff, Loader2, ArrowLeft, User, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthView = "login" | "signup" | "reset" | "phone-verify";
type Role = "client" | "carrier";

const AuthPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPhoneCode,
    verifyPhoneCode,
    sendPasswordReset,
    user,
    loading: authLoading,
  } = useFirebaseAuth();

  // Состояния интерфейса
  const [authView, setAuthView] = useState<AuthView>("login");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Поля ввода
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Защита от мерцания: если юзер залогинился, уходим на дашборд
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // --- ОБРАБОТЧИКИ ---

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await signInWithEmail(email.trim(), password);
    if (error) {
      toast({ title: "Ошибка входа", description: "Неверные данные или домен не разрешен.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast({ title: "Ошибка", description: "Введите имя", variant: "destructive" });
    setIsSubmitting(true);
    const { error } = await signUpWithEmail(email.trim(), password, role, name);
    if (error) {
      toast({ title: "Ошибка регистрации", description: error.message, variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error, confirmationResult: result } = await sendPhoneCode(phone, "recaptcha-container");
    if (error) {
      toast({ title: "Ошибка СМС", description: error.message, variant: "destructive" });
      setIsSubmitting(false);
    } else {
      setConfirmationResult(result);
      setAuthView("phone-verify");
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    const { error } = await verifyPhoneCode(confirmationResult, otp, role);
    if (error) {
      toast({ title: "Код неверен", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    const { error } = await signInWithGoogle(role);
    if (error) {
      toast({
        title: "Ошибка Google",
        description: "Проверьте Authorized Domains в Firebase Console.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (authLoading && !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0e14]">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white flex flex-col items-center justify-center p-4 font-sans">
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-blue-500 tracking-tighter uppercase mb-1">{BRAND.name}</h1>
          <p className="text-slate-500 text-sm">Система управления логистикой</p>
        </div>

        <Card className="bg-[#111827] border-slate-800 shadow-2xl border-t-4 border-t-blue-600">
          <CardContent className="pt-6">
            {/* ЭКРАН СБРОСА ПАРОЛЯ */}
            {authView === "reset" && (
              <div className="space-y-4 animate-in fade-in">
                <Button
                  variant="ghost"
                  className="p-0 text-slate-400 hover:text-white"
                  onClick={() => setAuthView("login")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                </Button>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Восстановление</h2>
                  <p className="text-sm text-slate-400">Мы отправим ссылку для смены пароля</p>
                </div>
                <Input
                  className="bg-slate-900 border-slate-700"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button className="w-full bg-blue-600" onClick={() => sendPasswordReset(email)} disabled={isSubmitting}>
                  Отправить
                </Button>
              </div>
            )}

            {/* ЭКРАН ПОДТВЕРЖДЕНИЯ ТЕЛЕФОНА */}
            {authView === "phone-verify" && (
              <div className="space-y-6 text-center animate-in zoom-in-95">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Код из СМС</h2>
                  <p className="text-sm text-slate-400">Мы отправили код на {phone}</p>
                </div>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="bg-slate-900 border-slate-700 w-12 h-12" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full bg-blue-600 h-12"
                  onClick={handleVerifyOtp}
                  disabled={isSubmitting || otp.length < 6}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Подтвердить"}
                </Button>
              </div>
            )}

            {/* ОСНОВНЫЕ ВКЛАДКИ (ВХОД / РЕГИСТРАЦИЯ) */}
            {(authView === "login" || authView === "signup") && (
              <Tabs value={authView} onValueChange={(v) => setAuthView(v as AuthView)}>
                <TabsList className="grid w-full grid-cols-2 bg-slate-950 mb-6 p-1 h-12">
                  <TabsTrigger value="login" className="data-[state=active]:bg-blue-600">
                    Вход
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600">
                    Регистрация
                  </TabsTrigger>
                </TabsList>

                {/* ВХОД */}
                <TabsContent value="login" className="space-y-4">
                  <div className="flex bg-slate-950 p-1 rounded-lg gap-1 mb-4">
                    <Button
                      variant={authMethod === "email" ? "secondary" : "ghost"}
                      className="flex-1 h-8 text-xs"
                      onClick={() => setAuthMethod("email")}
                    >
                      Email
                    </Button>
                    <Button
                      variant={authMethod === "phone" ? "secondary" : "ghost"}
                      className="flex-1 h-8 text-xs"
                      onClick={() => setAuthMethod("phone")}
                    >
                      Телефон
                    </Button>
                  </div>

                  {authMethod === "email" ? (
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-400">Email</Label>
                        <Input
                          className="bg-slate-900 border-slate-700"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-slate-400">Пароль</Label>
                          <button type="button" onClick={() => setAuthView("reset")} className="text-xs text-blue-500">
                            Забыли?
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            className="bg-slate-900 border-slate-700 pr-10"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-500"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-blue-600 h-11 font-bold" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Войти"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <Label className="text-slate-400">Номер телефона</Label>
                      <Input
                        className="bg-slate-900 border-slate-700"
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                      <Button type="submit" className="w-full bg-blue-600" disabled={isSubmitting}>
                        Получить код
                      </Button>
                    </form>
                  )}
                </TabsContent>

                {/* РЕГИСТРАЦИЯ */}
                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      className="bg-slate-900 border-slate-700"
                      placeholder="Ваше полное имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                      className="bg-slate-900 border-slate-700"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      className="bg-slate-900 border-slate-700"
                      type="password"
                      placeholder="Придумайте пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />

                    <div className="pt-2">
                      <Label className="text-xs text-slate-500 mb-2 block">Выберите вашу роль в системе:</Label>
                      <RadioGroup
                        value={role}
                        onValueChange={(v) => setRole(v as Role)}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className="relative">
                          <RadioGroupItem value="client" id="r-client" className="peer sr-only" />
                          <Label
                            htmlFor="r-client"
                            className="flex flex-col items-center p-3 border-2 border-slate-800 rounded-xl cursor-pointer peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-500/5 transition-all"
                          >
                            <User className="w-5 h-5 mb-1 text-slate-400" />{" "}
                            <span className="text-[10px] uppercase font-bold">Я Клиент</span>
                          </Label>
                        </div>
                        <div className="relative">
                          <RadioGroupItem value="carrier" id="r-carrier" className="peer sr-only" />
                          <Label
                            htmlFor="r-carrier"
                            className="flex flex-col items-center p-3 border-2 border-slate-800 rounded-xl cursor-pointer peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-500/5 transition-all"
                          >
                            <Truck className="w-5 h-5 mb-1 text-slate-400" />{" "}
                            <span className="text-[10px] uppercase font-bold">Я Водитель</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Button
                      className="w-full bg-blue-600 h-11 mt-2 font-bold"
                      onClick={handleEmailSignup}
                      disabled={isSubmitting}
                    >
                      Создать аккаунт
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="bg-[#111827] px-4 text-slate-500">Социальные сети</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-slate-700 hover:bg-slate-800 text-sm h-11"
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.64 0 3.1.56 4.26 1.67l3.18-3.18C17.47 1.63 14.94 1 12 1 7.73 1 4.05 3.43 2.18 7l3.66 2.84C6.71 7.25 9.14 5.04 12 5.04z"
                />
              </svg>
              Продолжить через Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
