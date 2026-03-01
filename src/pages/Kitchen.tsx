import { useOrders } from "@/contexts/OrderContext";
import OrderCard from "@/components/OrderCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";

const Kitchen = () => {
  const { getOrdersByStatus, updateOrderStatus } = useOrders();
  const pending = getOrdersByStatus("pending");
  const preparing = getOrdersByStatus("preparing");

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

      <div className="flex-1 grid grid-cols-2 divide-x divide-border/30">
        {/* Pending column */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
            <span className="status-pending px-2 py-1 rounded text-xs font-medium">New Orders</span>
            <span className="text-sm text-muted-foreground">{pending.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pending.length === 0 && <p className="text-muted-foreground text-center py-12">No new orders</p>}
            {pending.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nextLabel="Start Preparing"
                onAdvance={() => updateOrderStatus(order.id, "preparing")}
              />
            ))}
          </div>
        </div>

        {/* Preparing column */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
            <span className="status-preparing px-2 py-1 rounded text-xs font-medium">Preparing</span>
            <span className="text-sm text-muted-foreground">{preparing.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {preparing.length === 0 && <p className="text-muted-foreground text-center py-12">Nothing cooking</p>}
            {preparing.map((order) => (
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
