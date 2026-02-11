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
import { BRAND } from "@/config/brand";
import { ArrowLeft, Loader2, Phone, MessageCircle, User, Truck, CheckCircle } from "lucide-react";

type Step = 'phone' | 'otp' | 'register';
type Role = 'client' | 'carrier';

const TelegramAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState('');

  // Check if already logged in via telegram
  useEffect(() => {
    const telegramUser = localStorage.getItem('telegram_user');
    if (telegramUser) {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
      toast({ title: "Ошибка", description: "Введите корректный номер телефона", variant: "destructive" });
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
        setCountdown(120);
        toast({ 
          title: "Код отправлен", 
          description: "Проверьте @asloguz бот в Telegram" 
        });
      } else {
        throw new Error(data.error || 'Ошибка отправки кода');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({ title: "Ошибка", description: error.message || "Не удалось отправить код", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast({ title: "Ошибка", description: "Введите 6-значный код", variant: "destructive" });
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
        throw new Error(data.error || 'Неверный код');
      }

      if (data.action === 'login') {
        // Existing user - login
        localStorage.setItem('telegram_user', JSON.stringify(data.user));
        toast({ title: "Добро пожаловать!", description: `Вы вошли как ${data.user.fullName}` });
        navigate('/dashboard');
      } else if (data.action === 'needs_registration') {
        // New user - show registration form
        setVerifiedPhone(digits);
        setStep('register');
        toast({ title: "Телефон подтверждён", description: "Заполните данные для регистрации" });
      } else if (data.action === 'registered') {
        localStorage.setItem('telegram_user', JSON.stringify(data.user));
        toast({ title: "Регистрация завершена!", description: "Добро пожаловать!" });
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({ title: "Ошибка", description: error.message || "Неверный код", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast({ title: "Ошибка", description: "Введите ваше имя (минимум 2 символа)", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-login', {
        body: { 
          action: 'verify', 
          phone: verifiedPhone, 
          code: otp, 
          fullName: fullName.trim(), 
          role 
        }
      });

      if (error) throw error;

      if (data.success && (data.action === 'registered' || data.action === 'login')) {
        localStorage.setItem('telegram_user', JSON.stringify(data.user));
        toast({ title: "Регистрация завершена!", description: "Добро пожаловать в " + BRAND.name });
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Ошибка регистрации');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      toast({ title: "Ошибка", description: error.message || "Ошибка регистрации", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          На главную
        </Button>

        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Вход через Telegram</CardTitle>
            <CardDescription>
              Код придёт от бота <span className="font-semibold text-primary">@asloguz</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Step 1: Phone */}
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
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground">
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">Код будет отправлен в Telegram через бот @asloguz</span>
                </div>

                <Button
                  onClick={sendOTP}
                  disabled={loading || !phone}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Отправка...</>
                  ) : (
                    "Получить код"
                  )}
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

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Код отправлен на <span className="font-medium">{phone}</span>
                  </p>
                  {countdown > 0 && (
                    <p className="text-sm font-medium text-primary">
                      Код действителен: {formatCountdown(countdown)}
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setStep('phone'); setOtp(''); }} className="flex-1">
                    Изменить номер
                  </Button>
                  <Button onClick={verifyOTP} disabled={loading || otp.length !== 6} className="flex-1">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <><CheckCircle className="w-4 h-4 mr-2" />Подтвердить</>
                    )}
                  </Button>
                </div>

                {countdown === 0 && (
                  <Button variant="ghost" onClick={sendOTP} disabled={loading} className="w-full">
                    Отправить код повторно
                  </Button>
                )}
              </>
            )}

            {/* Step 3: Registration */}
            {step === 'register' && (
              <>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-foreground">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span className="text-sm">Телефон {phone} подтверждён</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Ваше имя</Label>
                  <Input
                    id="fullName"
                    placeholder="Иван Иванов"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
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

                <Button onClick={register} disabled={loading || !fullName.trim()} className="w-full" size="lg">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Регистрация...</>
                  ) : (
                    "Зарегистрироваться"
                  )}
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
