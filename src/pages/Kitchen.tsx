import { useOrders } from "@/contexts/OrderContext";
import OrderCard from "@/components/OrderCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";

const Kitchen = () => {
  const { getOrdersByStatus, updateOrderStatus } = useOrders();
  const sent = getOrdersByStatus("sent");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-primary font-heading">Kitchen</span>
        </div>
        <div className="flex gap-2">
          <Link to="/"><Button variant="outline" size="sm">POS</Button></Link>
          <Link to="/pickup"><Button variant="outline" size="sm">Pickup</Button></Link>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full border-x border-border/30">
        {/* New Orders column */}
        <div className="flex flex-col h-full">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="status-pending px-2 py-1 rounded text-xs font-medium">New Orders</span>
              <span className="text-sm text-muted-foreground">{sent.length}</span>
            </div>
            <span className="text-xs text-muted-foreground">Orders automatically disappear when marked Ready</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sent.length === 0 && <p className="text-muted-foreground text-center py-12">No new orders in kitchen</p>}
            {sent.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nextLabel="Mark Ready"
                onAdvance={() => updateOrderStatus(order.id, "ready")}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kitchen;
