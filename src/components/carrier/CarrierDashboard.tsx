import { AvailableOrdersList } from "./AvailableOrdersList";
import { MyResponsesList } from "./MyResponsesList";
import { MyDealsList } from "@/components/deals/MyDealsList";
import { CarrierPreferences } from "./CarrierPreferences";
import { CarrierStats } from "./CarrierStats";

export const CarrierDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MyDealsList />
        </div>
        <CarrierStats />
      </div>
      <AvailableOrdersList />
      <div className="grid lg:grid-cols-2 gap-6">
        <MyResponsesList />
        <CarrierPreferences />
      </div>
    </div>
  );
};
