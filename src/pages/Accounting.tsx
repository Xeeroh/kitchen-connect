import { useMemo } from "react";
import { useOrders } from "@/contexts/OrderContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, DollarSign, ShoppingCart, TrendingUp, Clock, CheckCircle, Package } from "lucide-react";

const Accounting = () => {
  const { orders } = useOrders();

  const stats = useMemo(() => {
    const today = new Date();
    const todayOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.toDateString() === today.toDateString();
    });

    const completed = todayOrders.filter((o) => o.status === "picked_up");
    const active = todayOrders.filter((o) => o.status !== "picked_up");
    const totalRevenue = completed.reduce((s, o) => s + o.total, 0);
    const pendingRevenue = active.reduce((s, o) => s + o.total, 0);
    const avgOrder = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Item breakdown
    const itemCounts: Record<string, { name: string; qty: number; revenue: number; emoji: string }> = {};
    completed.forEach((o) =>
      o.items.forEach((item) => {
        const key = item.menuItem.id;
        if (!itemCounts[key]) itemCounts[key] = { name: item.menuItem.name, qty: 0, revenue: 0, emoji: item.menuItem.emoji };
        itemCounts[key].qty += item.quantity;
        itemCounts[key].revenue += item.menuItem.price * item.quantity;
      })
    );
    const topItems = Object.values(itemCounts).sort((a, b) => b.revenue - a.revenue);

    // Category breakdown
    const catRevenue: Record<string, number> = {};
    completed.forEach((o) =>
      o.items.forEach((item) => {
        catRevenue[item.menuItem.category] = (catRevenue[item.menuItem.category] || 0) + item.menuItem.price * item.quantity;
      })
    );
    const categoryBreakdown = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]);

    return { todayOrders, completed, active, totalRevenue, pendingRevenue, avgOrder, topItems, categoryBreakdown };
  }, [orders]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-primary font-heading">Daily Accounting</span>
        </div>
        <div className="flex gap-2">
          <Link to="/"><Button variant="outline" size="sm">Home</Button></Link>
          <Link to="/pos"><Button variant="outline" size="sm">POS</Button></Link>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-6">
        {/* Date header */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-4 h-4" /> Revenue
            </div>
            <p className="text-2xl font-bold text-primary">${stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle className="w-4 h-4" /> Completed
            </div>
            <p className="text-2xl font-bold">{stats.completed.length}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-4 h-4" /> Avg Order
            </div>
            <p className="text-2xl font-bold">${stats.avgOrder.toFixed(2)}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="w-4 h-4" /> Pending $
            </div>
            <p className="text-2xl font-bold text-warning">${stats.pendingRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Top selling items */}
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" /> Top Items
            </h3>
            {stats.topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No completed orders yet</p>
            ) : (
              <div className="space-y-2">
                {stats.topItems.slice(0, 10).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
                    <span>{item.emoji} {item.name}</span>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>×{item.qty}</span>
                      <span className="text-primary font-semibold w-20 text-right">${item.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category breakdown */}
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> By Category
            </h3>
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.categoryBreakdown.map(([cat, rev]) => {
                  const pct = stats.totalRevenue > 0 ? (rev / stats.totalRevenue) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{cat}</span>
                        <span className="text-primary font-semibold">${rev.toFixed(2)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Order history table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border/30">
            <h3 className="font-semibold">All Orders Today ({stats.todayOrders.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left p-3">Order</th>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">Items</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.todayOrders.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No orders today</td></tr>
                )}
                {stats.todayOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                    <td className="p-3 font-medium text-primary">{order.id}</td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3">{order.items.map((i) => `${i.quantity}× ${i.menuItem.name}`).join(", ")}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        order.status === "picked_up" ? "status-ready" :
                        order.status === "ready" ? "status-ready" :
                        order.status === "preparing" ? "status-preparing" : "status-pending"
                      }`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">${order.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
