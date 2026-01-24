import { useLocation } from "react-router-dom";
import { AvailableOrdersList } from "./AvailableOrdersList";
import { MyResponsesList } from "./MyResponsesList";
import { MyDealsList } from "@/components/deals/MyDealsList";
import { CarrierPreferences } from "./CarrierPreferences";
import { CarrierStats } from "./CarrierStats";
import { CarrierAchievements } from "./CarrierAchievements";
import { CarrierLevel } from "./CarrierLevel";
import { DriverPanel } from "./DriverPanel";
import { CentralAsiaRouteCalculator } from "@/components/calculator/CentralAsiaRouteCalculator";
import { useLanguage } from "@/contexts/LanguageContext";

export const CarrierDashboard = () => {
  const location = useLocation();
  const { t } = useLanguage();
  
  // Determine active section from hash
  const hash = location.hash.replace('#', '') || 'available';

  const renderContent = () => {
    switch (hash) {
      case 'available':
        return <AvailableOrdersList />;
      case 'responses':
        return <MyResponsesList />;
      case 'deals':
        return <MyDealsList />;
      case 'navigation':
        return <DriverPanel />;
      case 'achievements':
        return <CarrierAchievements />;
      case 'settings':
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            <CarrierPreferences />
            <CentralAsiaRouteCalculator />
          </div>
        );
      default:
        return <AvailableOrdersList />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CarrierLevel />
        <div className="lg:col-span-2">
          <CarrierStats />
        </div>
      </div>

      {/* Content based on sidebar navigation */}
      <div className="animate-fade-up">
        {renderContent()}
      </div>
    </div>
  );
};
