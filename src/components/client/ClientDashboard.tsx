import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CreateOrderForm } from "./CreateOrderForm";
import { OrdersList } from "./OrdersList";
import { MyDealsList } from "@/components/deals/MyDealsList";
import { FavoriteCarriersList } from "@/components/favorites/FavoriteCarriersList";

export const ClientDashboard = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  
  // Determine active section from hash
  const hash = location.hash.replace('#', '') || 'orders';

  const handleOrderCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Render content based on hash
  const renderContent = () => {
    switch (hash) {
      case 'deals':
        return <MyDealsList />;
      case 'favorites':
        return <FavoriteCarriersList />;
      case 'create-order':
        return (
          <div className="max-w-2xl">
            <CreateOrderForm onSuccess={handleOrderCreated} />
          </div>
        );
      case 'orders':
      default:
        return <OrdersList refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {renderContent()}
    </div>
  );
};
