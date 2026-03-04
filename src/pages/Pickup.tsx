import { useOrders } from "@/contexts/OrderContext";
import OrderCard from "@/components/OrderCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

const Pickup = () => {
  const { getOrdersByStatus, updateOrderStatus } = useOrders();
  const ready = getOrdersByStatus("ready");
  const pickedUp = getOrdersByStatus("served").slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-primary font-heading">Pickup</span>
        </div>
        <div className="flex gap-2">
          <Link to="/"><Button variant="outline" size="sm">POS</Button></Link>
          <Link to="/kitchen"><Button variant="outline" size="sm">Kitchen</Button></Link>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 divide-x divide-border/30">
        {/* Ready */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
            <span className="status-ready px-2 py-1 rounded text-xs font-medium">Ready for Pickup</span>
            <span className="text-sm text-muted-foreground">{ready.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {ready.length === 0 && <p className="text-muted-foreground text-center py-12">No orders ready</p>}
            {ready.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nextLabel="Picked Up ✓"
                onAdvance={() => updateOrderStatus(order.id, "served")}
              />
            ))}
          </div>
        </div>

        {/* Completed */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Recently Completed</span>
            <span className="text-sm text-muted-foreground">{pickedUp.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 opacity-60">
            {pickedUp.length === 0 && <p className="text-muted-foreground text-center py-12">No completed orders yet</p>}
            {pickedUp.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pickup;
