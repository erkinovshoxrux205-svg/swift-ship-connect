import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Navigation,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  Package,
  Volume2,
  VolumeX,
  Route,
  Fuel,
  AlertTriangle,
  Phone,
  MessageSquare,
  Play,
  Pause,
  Flag,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ActiveDeal {
  id: string;
  order_id: string;
  status: string;
  agreed_price: number;
  started_at: string | null;
  client_id: string;
  order?: {
    cargo_type: string;
    weight: number;
    pickup_address: string;
    delivery_address: string;
    description: string | null;
  };
  client_profile?: {
    full_name: string | null;
    phone: string | null;
  };
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  steps: RouteStep[];
}

const statusLabels: Record<string, { label: string; color: string; progress: number }> = {
  pending: { label: "Ожидание", color: "bg-yellow-500", progress: 10 },
  accepted: { label: "Принят", color: "bg-blue-500", progress: 30 },
  in_transit: { label: "В пути", color: "bg-purple-500", progress: 60 },
  delivered: { label: "Доставлен", color: "bg-green-500", progress: 100 },
};

export const DriverPanel = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { speak, speakInstruction, stop: stopVoice, isSpeaking, isLoading: voiceLoading } = useVoiceNavigation();

  const [activeDeals, setActiveDeals] = useState<ActiveDeal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<ActiveDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Fetch active deals for this carrier
  useEffect(() => {
    if (!user) return;

    const fetchDeals = async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          order:orders!order_id (
            cargo_type, weight, pickup_address, delivery_address, description
          )
        `)
        .eq("carrier_id", user.id)
        .in("status", ["pending", "accepted", "in_transit"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching deals:", error);
        setLoading(false);
        return;
      }

      // Fetch client profiles
      const dealsWithProfiles: ActiveDeal[] = [];
      for (const deal of data || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", deal.client_id)
          .single();

        dealsWithProfiles.push({
          ...deal,
          client_profile: profile || undefined,
        });
      }

      setActiveDeals(dealsWithProfiles);
      if (dealsWithProfiles.length > 0 && !selectedDeal) {
        setSelectedDeal(dealsWithProfiles[0]);
      }
      setLoading(false);
    };

    fetchDeals();

    // Subscribe to updates
    const channel = supabase
      .channel("driver-deals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deals",
          filter: `carrier_id=eq.${user.id}`,
        },
        () => {
          fetchDeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch route when deal is selected
  useEffect(() => {
    if (!selectedDeal?.order) return;

    const fetchRoute = async () => {
      try {
        const origin = selectedDeal.status === "accepted" 
          ? selectedDeal.order!.pickup_address 
          : currentPosition 
            ? `${currentPosition.lat},${currentPosition.lng}`
            : selectedDeal.order!.pickup_address;

        const destination = selectedDeal.order!.delivery_address;

        const { data, error } = await supabase.functions.invoke("google-directions", {
          body: { origin, destination },
        });

        if (error) throw error;

        if (data?.routes?.[0]?.legs?.[0]) {
          const leg = data.routes[0].legs[0];
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
            steps: leg.steps.map((step: any) => ({
              instruction: step.html_instructions.replace(/<[^>]*>/g, ""),
              distance: step.distance.text,
              duration: step.duration.text,
              maneuver: step.maneuver,
            })),
          });
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();
  }, [selectedDeal, currentPosition]);

  // GPS Tracking
  const startTracking = useCallback(() => {
    if (!selectedDeal || !navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });

        // Save to database
        await supabase.from("gps_locations").insert({
          deal_id: selectedDeal.id,
          carrier_id: user!.id,
          latitude,
          longitude,
        });
      },
      (error) => {
        console.error("GPS error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    setWatchId(id);
    setIsTracking(true);

    if (voiceEnabled) {
      speak("Отслеживание включено. Следуйте указаниям навигатора.");
    }
  }, [selectedDeal, voiceEnabled, speak]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    stopVoice();
  }, [watchId, stopVoice]);

  // Voice navigation for current step
  const announceCurrentStep = useCallback(() => {
    if (!routeInfo || !voiceEnabled) return;
    const step = routeInfo.steps[currentStepIndex];
    if (step) {
      speakInstruction(step.instruction, step.distance);
    }
  }, [routeInfo, currentStepIndex, voiceEnabled, speakInstruction]);

  const nextStep = () => {
    if (routeInfo && currentStepIndex < routeInfo.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      announceCurrentStep();
    }
  };

  const updateDealStatus = async (newStatus: string) => {
    if (!selectedDeal) return;

    const updates: any = { status: newStatus };
    if (newStatus === "in_transit") updates.started_at = new Date().toISOString();
    if (newStatus === "delivered") updates.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("deals")
      .update(updates)
      .eq("id", selectedDeal.id);

    if (error) {
      console.error("Error updating status:", error);
      return;
    }

    // Voice announcement
    if (voiceEnabled) {
      if (newStatus === "in_transit") {
        speak("Доставка начата. Следуйте к точке выдачи.");
      } else if (newStatus === "delivered") {
        speak("Доставка завершена. Отличная работа!");
      }
    }

    setSelectedDeal({ ...selectedDeal, status: newStatus });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activeDeals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">Нет активных заказов</h3>
          <p className="text-sm text-muted-foreground">
            Перейдите в раздел "Доступные заказы" чтобы найти новые заказы
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = selectedDeal ? statusLabels[selectedDeal.status] : null;

  return (
    <div className="space-y-4">
      {/* Deal Selector */}
      {activeDeals.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {activeDeals.map((deal) => (
            <Button
              key={deal.id}
              variant={selectedDeal?.id === deal.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDeal(deal)}
              className="whitespace-nowrap"
            >
              <Package className="w-4 h-4 mr-2" />
              {deal.order?.cargo_type}
            </Button>
          ))}
        </div>
      )}

      {selectedDeal && (
        <Tabs defaultValue="navigation" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="navigation">
              <Navigation className="w-4 h-4 mr-2" />
              Навигация
            </TabsTrigger>
            <TabsTrigger value="order">
              <Package className="w-4 h-4 mr-2" />
              Заказ
            </TabsTrigger>
            <TabsTrigger value="status">
              <Flag className="w-4 h-4 mr-2" />
              Статус
            </TabsTrigger>
          </TabsList>

          {/* Navigation Tab */}
          <TabsContent value="navigation" className="space-y-4">
            {/* Voice Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {voiceEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">Голосовые подсказки</p>
                      <p className="text-xs text-muted-foreground">
                        {isSpeaking ? "Говорю..." : voiceLoading ? "Загрузка..." : "Готов"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={voiceEnabled}
                    onCheckedChange={setVoiceEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Route Info */}
            {routeInfo && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    Маршрут
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Расстояние</p>
                      <p className="font-bold text-lg">{routeInfo.distance}</p>
                    </div>
                    <div className="glass-card p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Время в пути</p>
                      <p className="font-bold text-lg">{routeInfo.duration}</p>
                    </div>
                  </div>

                  {/* Current Step */}
                  {routeInfo.steps[currentStepIndex] && (
                    <div className="bg-primary/10 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">
                            Шаг {currentStepIndex + 1} из {routeInfo.steps.length}
                          </Badge>
                          <p className="font-medium">
                            {routeInfo.steps[currentStepIndex].instruction}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {routeInfo.steps[currentStepIndex].distance} • {routeInfo.steps[currentStepIndex].duration}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={announceCurrentStep}
                          disabled={!voiceEnabled}
                        >
                          <Volume2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Next Step Preview */}
                  {routeInfo.steps[currentStepIndex + 1] && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <ArrowRight className="w-4 h-4" />
                      <span>Далее: {routeInfo.steps[currentStepIndex + 1].instruction}</span>
                    </div>
                  )}

                  {/* Navigation Controls */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant={isTracking ? "destructive" : "default"}
                      onClick={isTracking ? stopTracking : startTracking}
                    >
                      {isTracking ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Остановить
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Начать навигацию
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={nextStep}
                      disabled={currentStepIndex >= routeInfo.steps.length - 1}
                    >
                      Далее
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Order Tab */}
          <TabsContent value="order" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Cargo Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedDeal.order?.cargo_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDeal.order?.weight} кг
                    </p>
                  </div>
                  <Badge className="ml-auto" variant="secondary">
                    {selectedDeal.agreed_price.toLocaleString("ru-RU")} ₽
                  </Badge>
                </div>

                {/* Description */}
                {selectedDeal.order?.description && (
                  <div className="text-sm bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground">{selectedDeal.order.description}</p>
                  </div>
                )}

                {/* Route */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-green-700" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Забрать</p>
                      <p className="text-sm font-medium">{selectedDeal.order?.pickup_address}</p>
                    </div>
                  </div>
                  <div className="ml-4 border-l-2 border-dashed border-muted h-4" />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-red-700" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Доставить</p>
                      <p className="text-sm font-medium">{selectedDeal.order?.delivery_address}</p>
                    </div>
                  </div>
                </div>

                {/* Client Contact */}
                {selectedDeal.client_profile && (
                  <div className="flex items-center gap-3 pt-3 border-t">
                    <div className="flex-1">
                      <p className="font-medium">{selectedDeal.client_profile.full_name || "Клиент"}</p>
                      <p className="text-sm text-muted-foreground">Заказчик</p>
                    </div>
                    <div className="flex gap-2">
                      {selectedDeal.client_profile.phone && (
                        <Button size="icon" variant="outline" asChild>
                          <a href={`tel:${selectedDeal.client_profile.phone}`}>
                            <Phone className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button size="icon" variant="outline" asChild>
                        <a href={`/deals/${selectedDeal.id}/chat`}>
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Прогресс доставки</span>
                    <span className="font-medium">{currentStatus?.progress || 0}%</span>
                  </div>
                  <Progress value={currentStatus?.progress || 0} className="h-3" />
                </div>

                {/* Status Timeline */}
                <div className="space-y-4">
                  {Object.entries(statusLabels).filter(([key]) => key !== "pending").map(([key, config], index) => {
                    const isActive = selectedDeal.status === key;
                    const isPast = config.progress < (currentStatus?.progress || 0);
                    
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive || isPast ? config.color : "bg-muted"
                        } ${isActive || isPast ? "text-white" : "text-muted-foreground"}`}>
                          {isPast ? <CheckCircle className="w-5 h-5" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isActive ? "" : "text-muted-foreground"}`}>
                            {config.label}
                          </p>
                        </div>
                        {isActive && <Badge>Текущий</Badge>}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t">
                  {selectedDeal.status === "pending" && (
                    <Button
                      className="w-full"
                      onClick={() => updateDealStatus("accepted")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Принять заказ
                    </Button>
                  )}
                  {selectedDeal.status === "accepted" && (
                    <Button
                      className="w-full"
                      onClick={() => updateDealStatus("in_transit")}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Начать доставку
                    </Button>
                  )}
                  {selectedDeal.status === "in_transit" && (
                    <Button
                      className="w-full"
                      variant="driver"
                      onClick={() => updateDealStatus("delivered")}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Завершить доставку
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
