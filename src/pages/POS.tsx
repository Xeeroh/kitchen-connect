import { useState } from "react";
import { useOrders } from "@/contexts/OrderContext";
import { categories, MenuItem, OrderItem } from "@/data/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, Plus, Minus, Send } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const POS = () => {
  const { menu, addOrder } = useOrders();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) return prev.map((c) => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.menuItem.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0)
    );
  };

  const total = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);

  const placeOrder = () => {
    if (cart.length === 0) return;
    addOrder(cart, tableNumber ? parseInt(tableNumber) : undefined, customerName || undefined);
    setCart([]);
    setTableNumber("");
    setCustomerName("");
    toast.success("Order placed!");
  };

  const filteredItems = menu.filter((m) => m.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
        <Link to="/" className="text-xl font-bold text-primary font-heading">🍽️ POS</Link>
        <div className="flex gap-2">
          <Link to="/kitchen"><Button variant="outline" size="sm">Kitchen</Button></Link>
          <Link to="/pickup"><Button variant="outline" size="sm">Pickup</Button></Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Categories */}
          <div className="flex gap-2 p-3 overflow-x-auto border-b border-border/30">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="glass-card p-4 text-left hover:border-primary/50 transition-all active:scale-95"
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <h3 className="font-medium mt-2 text-sm">{item.name}</h3>
                  <p className="text-primary font-semibold mt-1">${item.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart sidebar */}
        <div className="w-80 border-l border-border/50 bg-card/30 flex flex-col">
          <div className="p-3 border-b border-border/30 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="font-semibold">Current Order</span>
            <span className="ml-auto text-sm text-muted-foreground">{cart.length} items</span>
          </div>

          <div className="p-3 space-y-2 border-b border-border/30">
            <Input
              placeholder="Table # (optional)"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Tap items to add them</p>
            )}
            {cart.map((item) => (
              <div key={item.menuItem.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/50">
                <span className="text-lg">{item.menuItem.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.menuItem.name}</p>
                  <p className="text-xs text-muted-foreground">${(item.menuItem.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.menuItem.id, -1)} className="p-1 rounded hover:bg-muted">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menuItem.id, 1)} className="p-1 rounded hover:bg-muted">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => updateQuantity(item.menuItem.id, -item.quantity)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border/50 space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
            <Button className="w-full h-12 text-base font-semibold animate-pulse-glow" onClick={placeOrder} disabled={cart.length === 0}>
              <Send className="w-4 h-4 mr-2" /> Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
