import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { BRAND } from "@/config/brand";
import { ArrowLeft, Loader2, Phone, MessageCircle, User, Truck, CheckCircle, AlertTriangle } from "lucide-react";

type Step = 'phone' | 'otp' | 'register';
type Role = 'client' | 'carrier';

const MAX_ATTEMPTS = 3;
const OTP_TIMER_SECONDS = 180; // 3 minutes
const RESEND_COOLDOWN = 60;

const TelegramAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loginWithTelegram } = useFirebaseAuth();
  
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  // OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const sendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 12) {
      toast({ title: "Ошибка", description: "Введите корректный номер (+998XXXXXXXXX)", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-login', {
        body: { action: 'send', phone: digits }
      });

      if (error) throw error;

      if (data.success) {
        setStep('otp');
        setCountdown(OTP_TIMER_SECONDS);
        setResendCooldown(RESEND_COOLDOWN);
        setAttempts(0);
        setBlocked(false);
        setOtp('');
        toast({ title: "Код отправлен", description: "Проверьте бот @asloguz в Telegram" });
      } else {
        throw new Error(data.error || 'Ошибка отправки');
      }
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message || "Не удалось отправить код", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length < 4) {
      toast({ title: "Ошибка", description: "Введите полный код", variant: "destructive" });
      return;
    }

    if (blocked) {
      toast({ title: "Заблокировано", description: "Слишком много попыток. Запросите новый код.", variant: "destructive" });
      return;
    }

    const digits = phone.replace(/\D/g, '');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-login', {
        body: { action: 'verify', phone: digits, code: otp }
      });

      if (error) throw error;

      if (!data.success) {
        if (data.blocked) {
          setBlocked(true);
          setAttempts(MAX_ATTEMPTS);
        } else if (data.attemptsRemaining !== undefined) {
          setAttempts(MAX_ATTEMPTS - data.attemptsRemaining);
        }
        throw new Error(data.error || 'Неверный код');
      }

      if (data.action === 'login') {
        // Existing user → login via unified context
        loginWithTelegram({ user: data.user, sessionToken: data.sessionToken });
        toast({ title: "Добро пожаловать!", description: `Вы вошли как ${data.user.fullName}` });
        navigate('/dashboard');
      } else if (data.action === 'needs_registration') {
        setVerifiedPhone(digits);
        setStep('register');
        toast({ title: "Телефон подтверждён", description: "Заполните данные для регистрации" });
      }
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message || "Неверный код", variant: "destructive" });
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast({ title: "Ошибка", description: "Введите имя (минимум 2 символа)", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-login', {
        body: { action: 'register', phone: verifiedPhone, fullName: fullName.trim(), role }
      });

      if (error) throw error;

      if (data.success && (data.action === 'registered' || data.action === 'login')) {
        loginWithTelegram({ user: data.user, sessionToken: data.sessionToken });
        toast({ title: "Регистрация завершена!", description: `Добро пожаловать в ${BRAND.name}` });
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Ошибка регистрации');
      }
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message || "Ошибка регистрации", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Button variant="ghost" className="mb-4" onClick={() => step === 'phone' ? navigate("/") : setStep('phone')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 'phone' ? 'На главную' : 'Назад'}
        </Button>

        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 'register' ? 'Регистрация' : 'Вход через Telegram'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' && <>Код придёт от бота <span className="font-semibold text-primary">@asloguz</span></>}
              {step === 'otp' && 'Введите код из Telegram'}
              {step === 'register' && 'Заполните данные для создания аккаунта'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ─── STEP 1: PHONE ────────────────────────────────────── */}
            {step === 'phone' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Номер телефона
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="text-lg"
                    maxLength={17}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground">
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">Код будет отправлен через бот @asloguz в Telegram</span>
                </div>

                <Button onClick={sendOTP} disabled={loading || phone.replace(/\D/g, '').length < 12} className="w-full" size="lg">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Отправка...</> : "Получить код"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Или</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                  Войти через Email
                </Button>
              </>
            )}

            {/* ─── STEP 2: OTP ──────────────────────────────────────── */}
            {step === 'otp' && (
              <>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Код отправлен на <span className="font-medium text-foreground">{phone}</span>
                  </p>
                  {countdown > 0 && (
                    <p className="text-sm font-medium text-primary">
                      Код действителен: {formatTime(countdown)}
                    </p>
                  )}
                  {countdown === 0 && (
                    <p className="text-sm font-medium text-destructive">
                      Код истёк
                    </p>
                  )}
                </div>

                {/* Attempt counter */}
                {attempts > 0 && !blocked && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Попытка {attempts} из {MAX_ATTEMPTS}</span>
                  </div>
                )}

                {blocked && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Попытки исчерпаны. Запросите новый код.</span>
                  </div>
                )}

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setStep('phone'); setOtp(''); setAttempts(0); setBlocked(false); }} className="flex-1">
                    Изменить номер
                  </Button>
                  <Button
                    onClick={verifyOTP}
                    disabled={loading || otp.length < 4 || blocked || countdown === 0}
                    className="flex-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <><CheckCircle className="w-4 h-4 mr-2" />Подтвердить</>
                    )}
                  </Button>
                </div>

                {(countdown === 0 || blocked) && resendCooldown === 0 && (
                  <Button variant="ghost" onClick={sendOTP} disabled={loading} className="w-full">
                    Отправить код повторно
                  </Button>
                )}

                {resendCooldown > 0 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Повторная отправка через {resendCooldown} сек.
                  </p>
                )}
              </>
            )}

            {/* ─── STEP 3: REGISTRATION ────────────────────────────── */}
            {step === 'register' && (
              <>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 text-foreground border border-primary/20">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span className="text-sm">Телефон <span className="font-medium">{phone || `+${verifiedPhone}`}</span> подтверждён</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Ваше полное имя</Label>
                  <Input
                    id="fullName"
                    placeholder="Иван Иванов"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Выберите роль</Label>
                  <RadioGroup value={role} onValueChange={v => setRole(v as Role)} className="grid grid-cols-2 gap-4">
                    <Label htmlFor="tg-role-client" className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${role === "client" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <RadioGroupItem value="client" id="tg-role-client" className="sr-only" />
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium">Клиент</span>
                      <span className="text-xs text-muted-foreground text-center">Заказываю доставку</span>
                    </Label>
                    <Label htmlFor="tg-role-carrier" className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${role === "carrier" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <RadioGroupItem value="carrier" id="tg-role-carrier" className="sr-only" />
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium">Перевозчик</span>
                      <span className="text-xs text-muted-foreground text-center">Выполняю заказы</span>
                    </Label>
                  </RadioGroup>
                </div>

                <Button onClick={register} disabled={loading || fullName.trim().length < 2} className="w-full" size="lg">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Регистрация...</> : "Зарегистрироваться"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TelegramAuth;
