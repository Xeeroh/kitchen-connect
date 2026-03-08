import { Order, OrderStatus } from "@/data/menu";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, Package, Check, Banknote, CreditCard, ArrowRightLeft } from "lucide-react";

const paymentIcons = {
  cash: <Banknote className="w-3 h-3" />,
  card: <CreditCard className="w-3 h-3" />,
  transfer: <ArrowRightLeft className="w-3 h-3" />,
};

const statusConfig: Record<OrderStatus, { label: string; class: string; icon: React.ReactNode }> = {
  pending: { label: "Cart", class: "status-pending", icon: <Clock className="w-4 h-4" /> },
  sent: { label: "New", class: "status-pending", icon: <Clock className="w-4 h-4" /> },
  ready: { label: "Ready", class: "status-ready", icon: <Package className="w-4 h-4" /> },
  served: { label: "Done", class: "status-ready", icon: <Check className="w-4 h-4" /> },
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
          <span className="text-xl font-bold font-heading text-primary">
            {order.tableNumber ? `Mesa ${order.tableNumber}` : order.customerName || "Pedido"}
          </span>
          <span className="text-xs text-muted-foreground ml-2 opacity-50" title={order.id}>
            #{order.id.slice(0, 4)}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${config.class}`}>
          {config.icon} {config.label}
        </span>
      </div>

      {order.customerName && order.tableNumber && (
        <p className="text-sm text-muted-foreground mb-2">{order.customerName}</p>
      )}

      <div className="space-y-4 mb-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex flex-col gap-1 border-b border-border/10 pb-2 last:border-0 last:pb-0">
            <div className="flex justify-between text-sm items-start">
              <div className="flex flex-col">
                <span className="font-heading">
                  {item.menuItem.emoji} {item.quantity}× {item.menuItem.name}
                </span>
                {item.seat && (
                  <span className="text-[9px] font-bold text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded w-fit mt-0.5 uppercase tracking-tighter">
                    Asiento {item.seat}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground text-[10px]">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
            </div>
            {item.notes && (
              <span className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-sm self-start">
                Nota: {item.notes}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {elapsed}m</span>
          <span className="flex items-center gap-1">{paymentIcons[order.paymentMethod]} {order.paymentMethod}</span>
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
