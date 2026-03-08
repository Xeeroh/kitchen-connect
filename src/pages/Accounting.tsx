import { useMemo, useState } from "react";
import { useOrders } from "@/contexts/OrderContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, DollarSign, ShoppingCart, TrendingUp, Clock, CheckCircle, Package, Banknote, CreditCard, ArrowRightLeft, Send, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const Accounting = () => {
  const { orders, tabs, exchangeRate, setExchangeRate } = useOrders();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const stats = useMemo(() => {
    const filterDate = new Date(selectedDate + 'T00:00:00');
    const filteredTabs = tabs.filter((t) => {
      const d = new Date(t.createdAt);
      return d.toDateString() === filterDate.toDateString();
    });

    const completedTabs = filteredTabs.filter((t) => t.status === "closed");
    const openTabs = filteredTabs.filter((t) => t.status === "open");

    const totalRevenue = completedTabs.reduce((s, t) => s + t.total, 0);
    const pendingRevenue = openTabs.reduce((s, t) => s + t.total, 0);
    const avgOrder = completedTabs.length > 0 ? totalRevenue / completedTabs.length : 0;

    const filteredOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.toDateString() === filterDate.toDateString();
    });

    const completed = filteredOrders.filter((o) => o.status === "served");
    const active = filteredOrders.filter((o) => o.status !== "served");

    // Item breakdown (Using all items from completed tabs for accuracy)
    const itemCounts: Record<string, { name: string; qty: number; revenue: number; emoji: string }> = {};
    completedTabs.forEach((t) =>
      t.items.forEach((item) => {
        const key = item.menuItem.id;
        if (!itemCounts[key]) itemCounts[key] = { name: item.menuItem.name, qty: 0, revenue: 0, emoji: item.menuItem.emoji };
        itemCounts[key].qty += item.quantity;
        itemCounts[key].revenue += item.menuItem.price * item.quantity;
      })
    );
    const topItems = Object.values(itemCounts).sort((a, b) => b.revenue - a.revenue);

    // Category breakdown
    const catRevenue: Record<string, number> = {};
    completedTabs.forEach((t) =>
      t.items.forEach((item) => {
        catRevenue[item.menuItem.category] = (catRevenue[item.menuItem.category] || 0) + item.menuItem.price * item.quantity;
      })
    );
    const categoryBreakdown = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]);

    // Payment method breakdown
    const paymentBreakdown: Record<string, { count: number; revenue: number }> = {};
    completedTabs.forEach((t) => {
      const pm = t.paymentMethod || "cash";
      if (!paymentBreakdown[pm]) paymentBreakdown[pm] = { count: 0, revenue: 0 };
      paymentBreakdown[pm].count++;
      paymentBreakdown[pm].revenue += t.total;
    });

    return { filteredTabs, completedTabs, openTabs, totalRevenue, pendingRevenue, avgOrder, topItems, categoryBreakdown, paymentBreakdown };
  }, [orders, tabs, selectedDate]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-primary font-heading">Contabilidad Diaria</span>
        </div>
        <div className="flex gap-2">
          <Link to="/"><Button variant="outline" size="sm">Home</Button></Link>
          <Link to="/pos"><Button variant="outline" size="sm">POS</Button></Link>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-6">
        {/* Date selection and header */}
        <div className="flex flex-col items-center gap-4 bg-card/30 p-6 rounded-xl border border-border/50 shadow-sm">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary font-heading">Corte del Día</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Selecciona una fecha para ver el desglose de ventas
            </p>
          </div>

          <div className="flex items-center gap-3 bg-background p-2 rounded-lg border border-primary/20 shadow-inner">
            <div className="p-2 bg-primary/10 rounded-md">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <Input
              type="date"
              className="w-44 border-none focus-visible:ring-0 text-lg font-semibold cursor-pointer"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="text-center">
            <p className="text-primary font-medium">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
        </div>

        {/* Exchange Rate Setting */}
        <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Configuración de Divisa</p>
              <p className="text-xs text-muted-foreground">El cambio de las compras se dará siempre en pesos mexicanos.</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-background p-1.5 rounded-md border border-input shadow-sm">
            <span className="text-xs font-bold px-2 py-0.5 bg-secondary rounded text-muted-foreground mr-1">T.C.</span>
            <span className="text-sm font-bold">1 USD = $</span>
            <Input
              type="number"
              className="w-20 h-8 border-none focus-visible:ring-0 font-bold text-primary px-1 text-center"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              step="0.01"
            />
            <span className="text-sm font-bold mr-2 text-muted-foreground">MXN</span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-4 h-4" /> Ganancias
            </div>
            <p className="text-2xl font-bold text-primary">${stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle className="w-4 h-4" /> Completadas
            </div>
            <p className="text-2xl font-bold">{stats.completedTabs.length}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-4 h-4" /> Ordenes Promedio
            </div>
            <p className="text-2xl font-bold">${stats.avgOrder.toFixed(2)}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="w-4 h-4" /> Pendientes $
            </div>
            <p className="text-2xl font-bold text-warning">${stats.pendingRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment method breakdown */}
        <div className="grid grid-cols-3 gap-3">
          {(["cash", "card", "transfer"] as const).map((pm) => {
            const data = stats.paymentBreakdown[pm] || { count: 0, revenue: 0 };
            const icons = { cash: <Banknote className="w-5 h-5" />, card: <CreditCard className="w-5 h-5" />, transfer: <ArrowRightLeft className="w-5 h-5" /> };
            return (
              <div key={pm} className="glass-card p-4 flex items-center gap-3">
                <div className="text-primary">{icons[pm]}</div>
                <div>
                  <p className="text-xs text-muted-foreground capitalize">{pm}</p>
                  <p className="font-bold">${data.revenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{data.count} ordenes</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Top selling items */}
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" /> Más Vendidos
            </h3>
            {stats.topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay productos vendidos aún</p>
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
              <Package className="w-4 h-4 text-primary" /> Por Categorias
            </h3>
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay productos vendidos aún</p>
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

        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border/30">
            <h3 className="font-semibold">Historial de Cuentas ({stats.filteredTabs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left p-3">Cuenta</th>
                  <th className="text-left p-3">Hora</th>
                  <th className="text-left p-3">Consumo</th>
                  <th className="text-left p-3">Pago</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-right p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.filteredTabs.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay registros para esta fecha</td></tr>
                )}
                {[...stats.filteredTabs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((tab) => (
                  <tr key={tab.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">
                          {tab.tableNumber ? `Mesa ${tab.tableNumber}` : tab.customerName || "Venta Directa"}
                        </span>
                        <span className="text-[10px] text-muted-foreground opacity-50">#{tab.id.slice(-4)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(tab.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                      {tab.items.map((i) => `${i.quantity}× ${i.menuItem.name}`).join(", ")}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {tab.paymentMethod === 'cash' && <><DollarSign className="w-3 h-3 text-emerald-500" /> Efectivo</>}
                        {tab.paymentMethod === 'card' && <><CreditCard className="w-3 h-3 text-blue-500" /> Tarjeta</>}
                        {tab.paymentMethod === 'transfer' && <><Send className="w-3 h-3 text-purple-500" /> Transf.</>}
                        {!tab.paymentMethod && <span className="italic">Pnd.</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${tab.status === "closed" ? "status-ready" : "status-pending"}`}>
                        {tab.status === "closed" ? "Pagada" : "Abierta"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">${tab.total.toFixed(2)}</td>
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
