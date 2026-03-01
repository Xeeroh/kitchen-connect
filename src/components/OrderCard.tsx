import { Order, OrderStatus } from "@/data/menu";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, Package, Check } from "lucide-react";

const statusConfig: Record<OrderStatus, { label: string; class: string; icon: React.ReactNode }> = {
  pending: { label: "New", class: "status-pending", icon: <Clock className="w-4 h-4" /> },
  preparing: { label: "Preparing", class: "status-preparing", icon: <ChefHat className="w-4 h-4" /> },
  ready: { label: "Ready", class: "status-ready", icon: <Package className="w-4 h-4" /> },
  picked_up: { label: "Done", class: "status-ready", icon: <Check className="w-4 h-4" /> },
};

interface OrderCardProps {
  order: Order;
  nextStatus?: OrderStatus;
  nextLabel?: string;
  onAdvance?: () => void;
}

const OrderCard = ({ order, nextStatus, nextLabel, onAdvance }: OrderCardProps) => {
  const config = statusConfig[order.status];
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

  return (
    <div className="glass-card p-4 animate-slide-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold font-heading text-primary">{order.id}</span>
          {order.tableNumber && (
            <span className="text-sm text-muted-foreground">Table {order.tableNumber}</span>
          )}
        </div>
        <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${config.class}`}>
          {config.icon} {config.label}
        </span>
      </div>

      {order.customerName && (
        <p className="text-sm text-muted-foreground mb-2">{order.customerName}</p>
      )}

      <div className="space-y-1 mb-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>
              {item.menuItem.emoji} {item.quantity}× {item.menuItem.name}
            </span>
            <span className="text-muted-foreground">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" /> {elapsed}m ago
        </div>
        <span className="font-semibold text-primary">${order.total.toFixed(2)}</span>
      </div>

      {onAdvance && nextLabel && (
        <Button className="w-full mt-3" onClick={onAdvance}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
};

export default OrderCard;
