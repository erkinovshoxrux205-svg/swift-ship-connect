import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { 
  User, Truck, ArrowLeft, ArrowRight, Loader2, 
  Mail, Building, Globe, CheckCircle, Shield, Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ConfirmationResult } from "firebase/auth";

const emailSchema = z.string().email("Неверный формат email");
const passwordSchema = z.string().min(6, "Минимум 6 символов");
const nameSchema = z.string().min(2, "Минимум 2 символа");
const phoneSchema = z.string().min(10, "Введите корректный телефон");

type Role = "client" | "carrier";
type AuthMethod = "email" | "phone";

interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: Role;
  companyName: string;
  businessType: string;
  country: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  authMethod: AuthMethod;
}

const STEPS = [
  { id: 1, title: "Роль", icon: User },
  { id: 2, title: "Контакты", icon: Mail },
  { id: 3, title: "Компания", icon: Building },
  { id: 4, title: "Подтверждение", icon: CheckCircle },
];

const COUNTRIES = [
  "Узбекистан",
  "Казахстан",
  "Россия",
  "Кыргызстан",
  "Таджикистан",
  "Туркменистан",
  "Азербайджан",
];

const BUSINESS_TYPES = [
  "ИП (Индивидуальный предприниматель)",
  "ООО (Общество с ограниченной ответственностью)",
  "АО (Акционерное общество)",
  "Физическое лицо",
  "Государственная организация",
];

const MultiStepRegistration = () => {
  const navigate = useNavigate();
  const { signUp, signInWithPhone, confirmPhoneCode, user, loading: authLoading } = useFirebaseAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [phoneVerifyStep, setPhoneVerifyStep] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "client",
    companyName: "",
    businessType: "",
    country: "Узбекистан",
    termsAccepted: false,
    privacyAccepted: false,
    authMethod: "email",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const updateField = <K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
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

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof RegistrationData, string>> = {};

    if (step === 2) {
      try {
        nameSchema.parse(formData.fullName);
      } catch {
        newErrors.fullName = "Введите имя (минимум 2 символа)";
      }

      if (formData.authMethod === "email") {
        try {
          emailSchema.parse(formData.email);
        } catch {
          newErrors.email = "Введите корректный email";
        }
        try {
          passwordSchema.parse(formData.password);
        } catch {
          newErrors.password = "Пароль минимум 6 символов";
        }
      } else {
        try {
          phoneSchema.parse(formData.phone);
        } catch {
          newErrors.phone = "Введите корректный телефон";
        }
      }
    }

    if (step === 4) {
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = "Примите условия использования";
      }
      if (!formData.privacyAccepted) {
        newErrors.privacyAccepted = "Примите политику конфиденциальности";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);

    try {
      if (formData.authMethod === "email") {
        const { error, user: newUser } = await signUp(
          formData.email,
          formData.password,
          formData.role,
          formData.fullName
        );

        if (error) {
          let message = "Произошла ошибка при регистрации";
          if (error.message.includes("email-already-in-use")) {
            message = "Этот email уже зарегистрирован";
          }
          toast({
            title: "Ошибка регистрации",
            description: message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Update profile with company info
        if (newUser) {
          await supabase
            .from("profiles")
            .update({
              company_name: formData.companyName || null,
            })
            .eq("firebase_uid", newUser.uid);

          await supabase
            .from("registration_requests")
            .insert({
              user_id: newUser.uid,
              company_name: formData.companyName || null,
              business_type: formData.businessType || null,
              country: formData.country,
              terms_accepted: formData.termsAccepted,
              privacy_accepted: formData.privacyAccepted,
              email_verified: true,
              status: 'pending',
              onboarding_step: 4,
            });
        }

        setEmailSent(true);
        toast({
          title: "Регистрация успешна!",
          description: "Добро пожаловать на платформу",
        });

        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        // Phone registration - send OTP
        const phoneE164 = getE164Phone(formData.phone);
        const { error, confirmationResult: result } = await signInWithPhone(phoneE164, 'recaptcha-container');
        
        if (error) {
          toast({
            title: "Ошибка",
            description: error.message || "Ошибка отправки SMS",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (result) {
          setConfirmationResult(result);
          setPhoneVerifyStep(true);
          toast({
            title: "SMS отправлено",
            description: "Введите код из SMS для завершения регистрации",
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить регистрацию",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!confirmationResult || otpCode.length !== 6) return;

    setLoading(true);
    const { error } = await confirmPhoneCode(confirmationResult, otpCode);
    
    if (error) {
      toast({
        title: "Неверный код",
        description: "Проверьте код и попробуйте снова",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Create profile and role in Supabase
    if (user) {
      await supabase
        .from("profiles")
        .upsert({
          user_id: user.uid,
          firebase_uid: user.uid,
          full_name: formData.fullName,
          phone: user.phoneNumber?.replace(/\D/g, '') || null,
          phone_verified: true,
          company_name: formData.companyName || null,
        });

      await supabase
        .from("firebase_user_roles")
        .upsert({
          firebase_uid: user.uid,
          role: formData.role,
        });

      await supabase
        .from("registration_requests")
        .insert({
          user_id: user.uid,
          company_name: formData.companyName || null,
          business_type: formData.businessType || null,
          country: formData.country,
          terms_accepted: formData.termsAccepted,
          privacy_accepted: formData.privacyAccepted,
          email_verified: true,
          status: 'pending',
          onboarding_step: 4,
        });

      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать на платформу",
      });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phoneVerifyStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Подтверждение телефона</CardTitle>
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
              disabled={loading || otpCode.length !== 6}
              onClick={handleVerifyPhone}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                "Завершить регистрацию"
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setPhoneVerifyStep(false);
                setOtpCode("");
                setConfirmationResult(null);
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

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Регистрация завершена!</h2>
            <p className="text-muted-foreground mb-4">
              Вы успешно зарегистрированы. Перенаправляем вас в личный кабинет...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-customer/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-driver/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => currentStep > 1 ? handleBack() : navigate("/auth")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep > 1 ? "Назад" : "К входу"}
        </Button>

        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
            <CardDescription>
              Создайте аккаунт на платформе AsiaLog
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                {STEPS.map((step) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : isCompleted 
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`text-xs mt-1 ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Progress value={progressPercent} className="h-1" />
            </div>

            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-center">Выберите вашу роль</h3>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => updateField("role", value as Role)}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="role-client"
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.role === "client"
                        ? "border-customer bg-customer/5"
                        : "border-border hover:border-customer/50"
                    }`}
                  >
                    <RadioGroupItem value="client" id="role-client" className="sr-only" />
                    <div className="w-16 h-16 rounded-full gradient-customer flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-semibold">Клиент</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Заказываю грузоперевозки
                    </span>
                  </Label>

                  <Label
                    htmlFor="role-carrier"
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.role === "carrier"
                        ? "border-driver bg-driver/5"
                        : "border-border hover:border-driver/50"
                    }`}
                  >
                    <RadioGroupItem value="carrier" id="role-carrier" className="sr-only" />
                    <div className="w-16 h-16 rounded-full gradient-driver flex items-center justify-center">
                      <Truck className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-semibold">Перевозчик</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Выполняю заказы
                    </span>
                  </Label>
                </RadioGroup>
              </div>
            )}

            {/* Step 2: Contact Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Auth Method Toggle */}
                <div className="flex rounded-lg border p-1 gap-1">
                  <Button
                    type="button"
                    variant={formData.authMethod === 'email' ? 'default' : 'ghost'}
                    className="flex-1"
                    size="sm"
                    onClick={() => updateField("authMethod", "email")}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={formData.authMethod === 'phone' ? 'default' : 'ghost'}
                    className="flex-1"
                    size="sm"
                    onClick={() => updateField("authMethod", "phone")}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Телефон
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Полное имя *</Label>
                  <Input
                    id="fullName"
                    placeholder="Иван Иванов"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
                </div>

                {formData.authMethod === "email" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@mail.com"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Пароль *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Минимум 6 символов"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        className={errors.password ? "border-red-500" : ""}
                      />
                      {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+998 90 123 45 67"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", formatPhone(e.target.value))}
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    <p className="text-xs text-muted-foreground">
                      SMS с кодом будет отправлено на этот номер
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Company Info */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Страна *</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => updateField("country", value)}
                  >
                    <SelectTrigger>
                      <Globe className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Название компании <span className="text-muted-foreground">(опционально)</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="ООО 'Логистика'"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">
                    Тип бизнеса <span className="text-muted-foreground">(опционально)</span>
                  </Label>
                  <Select 
                    value={formData.businessType} 
                    onValueChange={(value) => updateField("businessType", value)}
                  >
                    <SelectTrigger>
                      <Building className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Проверьте данные
                  </h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Роль:</span> {formData.role === "client" ? "Клиент" : "Перевозчик"}</p>
                    <p><span className="text-muted-foreground">Имя:</span> {formData.fullName}</p>
                    {formData.authMethod === "email" && (
                      <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                    )}
                    {formData.authMethod === "phone" && (
                      <p><span className="text-muted-foreground">Телефон:</span> {formData.phone}</p>
                    )}
                    <p><span className="text-muted-foreground">Страна:</span> {formData.country}</p>
                    {formData.companyName && (
                      <p><span className="text-muted-foreground">Компания:</span> {formData.companyName}</p>
                    )}
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => updateField("termsAccepted", checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      Я принимаю{" "}
                      <a href="#" className="text-primary hover:underline">
                        условия использования
                      </a>{" "}
                      платформы
                    </Label>
                  </div>
                  {errors.termsAccepted && <p className="text-xs text-red-500 ml-7">{errors.termsAccepted}</p>}

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="privacy"
                      checked={formData.privacyAccepted}
                      onCheckedChange={(checked) => updateField("privacyAccepted", checked as boolean)}
                    />
                    <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                      Я соглашаюсь с{" "}
                      <a href="#" className="text-primary hover:underline">
                        политикой конфиденциальности
                      </a>
                    </Label>
                  </div>
                  {errors.privacyAccepted && <p className="text-xs text-red-500 ml-7">{errors.privacyAccepted}</p>}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  className="flex-1"
                  variant="hero"
                  onClick={handleNext}
                >
                  Далее
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Регистрация...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Зарегистрироваться
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="recaptcha-container" />
    </div>
  );
};

export default MultiStepRegistration;
