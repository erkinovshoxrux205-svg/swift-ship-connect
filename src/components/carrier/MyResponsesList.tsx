import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, Package, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OrderData {
  cargo_type: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string;
  status: string;
}

interface ResponseData {
  id: string;
  order_id: string;
  price: number;
  delivery_time: string | null;
  comment: string | null;
  is_accepted: boolean;
  created_at: string;
  order?: OrderData | OrderData[];
}

export const MyResponsesList = () => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      if (!user) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("responses")
        .select(`
          *,
          order:orders(cargo_type, pickup_address, delivery_address, pickup_date, status)
        `)
        .eq("carrier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching responses:", error);
      } else if (data) {
        // Transform data to normalize order field
        const normalized = data.map((item) => ({
          ...item,
          order: Array.isArray(item.order) ? item.order[0] : item.order
        })) as ResponseData[];
        setResponses(normalized);
      }

      setLoading(false);
    };

    fetchResponses();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Мои отклики
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Вы ещё не откликались на заявки
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Мои отклики
        </CardTitle>
        <CardDescription>
          {responses.length} откликов отправлено
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {responses.map((response) => {
          const orderData = response.order as OrderData | undefined;
          return (
            <div
              key={response.id}
              className="p-3 rounded-lg border bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {orderData?.cargo_type || "Заявка"}
                    </span>
                    {response.is_accepted ? (
                      <Badge className="bg-driver text-white">Принято</Badge>
                    ) : (
                      <Badge variant="outline">Ожидает</Badge>
                    )}
                  </div>
                  {orderData && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {orderData.pickup_address} → {orderData.delivery_address}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Ваша цена: <span className="font-medium text-foreground">{response.price.toLocaleString()} ₽</span>
                    {response.delivery_time && ` • ${response.delivery_time}`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
