import { useState } from "react";
import { useOrders } from "@/contexts/OrderContext";
import { categories, MenuItem, PaymentMethod } from "@/data/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, Trash2, Plus, Minus, Banknote, CreditCard, ArrowRightLeft,
  PlusCircle, X, Receipt, Check, Send, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const POS = () => {
  const {
    menu, tabs, openTab, addItemToTab, updateTabItemQuantity,
    updateTab, sendToKitchen, closeTab, deleteTab, getUnsentItems,
  } = useOrders();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [payDialogTabId, setPayDialogTabId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [showNewTab, setShowNewTab] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const filteredItems = menu.filter((m) => m.category === activeCategory);
  const payTab = tabs.find((t) => t.id === payDialogTabId);
  const unsentItems = activeTab ? getUnsentItems(activeTab) : [];
  const hasUnsent = unsentItems.length > 0;

  const handleOpenTab = () => {
    const id = openTab(
      newTableNumber ? parseInt(newTableNumber) : undefined,
      newCustomerName || undefined
    );
    setActiveTabId(id);
    setShowNewTab(false);
    setNewTableNumber("");
    setNewCustomerName("");
    toast.success("Tab opened!");
  };

  const handleSendToKitchen = () => {
    if (!activeTab) return;
    sendToKitchen(activeTab.id);
    toast.success("Order sent to kitchen!");
  };

  const handleCloseTab = () => {
    if (!payDialogTabId) return;
    closeTab(payDialogTabId, paymentMethod);
    if (activeTabId === payDialogTabId) {
      setActiveTabId(tabs.length > 1 ? tabs.find((t) => t.id !== payDialogTabId)?.id || null : null);
    }
    setPayDialogTabId(null);
    setPaymentMethod("cash");
    toast.success("Tab closed & paid!");
  };

  const handleDeleteTab = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && tab.sentItems.length > 0) {
      toast.error("Can't delete a tab with orders already sent to kitchen");
      return;
    }
    deleteTab(tabId);
    if (activeTabId === tabId) {
      setActiveTabId(tabs.length > 1 ? tabs.find((t) => t.id !== tabId)?.id || null : null);
    }
    toast("Tab deleted");
  };

  // Check if an item has been sent (can't go below sent qty)
  const getSentQty = (itemId: string) => {
    if (!activeTab) return 0;
    const sent = activeTab.sentItems.find((s) => s.menuItem.id === itemId);
    return sent ? sent.quantity : 0;
  };

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

      {/* Tabs bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-card/30 overflow-x-auto">
        {tabs.map((tab) => {
          const tabUnsent = getUnsentItems(tab);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all group relative ${
                activeTabId === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              {tab.tableNumber ? `Table ${tab.tableNumber}` : tab.customerName || tab.id.replace("tab-", "Tab #")}
              <span className="text-xs opacity-70">${tab.total.toFixed(2)}</span>
              {tabUnsent.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-warning absolute -top-0.5 -right-0.5" />
              )}
              {tab.sentItems.length === 0 && (
                <span
                  onClick={(e) => { e.stopPropagation(); handleDeleteTab(tab.id); }}
                  className="p-0.5 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setShowNewTab(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" /> New Tab
        </button>
      </div>

      {/* New tab form */}
      {showNewTab && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-secondary/30">
          <Input placeholder="Table # (optional)" value={newTableNumber} onChange={(e) => setNewTableNumber(e.target.value)} className="h-8 text-sm w-28" />
          <Input placeholder="Customer name (optional)" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="h-8 text-sm w-40" />
          <Button size="sm" onClick={handleOpenTab}><Check className="w-3 h-3 mr-1" /> Open</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowNewTab(false)}><X className="w-3 h-3" /></Button>
        </div>
      )}

      {!activeTab ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Receipt className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">
              {tabs.length === 0 ? "No open tabs. Create one to start taking orders." : "Select a tab to start adding items."}
            </p>
            <Button variant="outline" onClick={() => setShowNewTab(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Open New Tab
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Menu area */}
          <div className="flex-1 flex flex-col overflow-hidden">
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

            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItemToTab(activeTab.id, item)}
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

          {/* Tab sidebar */}
          <div className="w-80 border-l border-border/50 bg-card/30 flex flex-col">
            <div className="p-3 border-b border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {activeTab.tableNumber ? `Table ${activeTab.tableNumber}` : activeTab.customerName || "Open Tab"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {activeTab.items.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Table #"
                  value={activeTab.tableNumber?.toString() || ""}
                  onChange={(e) => updateTab(activeTab.id, { tableNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="h-7 text-xs w-20"
                />
                <Input
                  placeholder="Customer"
                  value={activeTab.customerName || ""}
                  onChange={(e) => updateTab(activeTab.id, { customerName: e.target.value || undefined })}
                  className="h-7 text-xs flex-1"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {activeTab.items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Tap items to add them</p>
              )}

              {/* Sent items section */}
              {activeTab.sentItems.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3 text-success" /> Sent to kitchen
                  </p>
                  {activeTab.sentItems.map((item) => (
                    <div key={`sent-${item.menuItem.id}`} className="flex items-center gap-2 p-2 rounded-md bg-secondary/30 opacity-60 mb-1">
                      <span className="text-lg">{item.menuItem.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">${(item.menuItem.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <span className="text-sm text-muted-foreground w-6 text-center">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Unsent items section */}
              {hasUnsent && (
                <div>
                  {activeTab.sentItems.length > 0 && (
                    <p className="text-xs text-warning font-medium mb-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> New — not sent yet
                    </p>
                  )}
                  {unsentItems.map((item) => {
                    const totalQty = activeTab.items.find((i) => i.menuItem.id === item.menuItem.id)!.quantity;
                    const sentQty = getSentQty(item.menuItem.id);
                    return (
                      <div key={`unsent-${item.menuItem.id}`} className="flex items-center gap-2 p-2 rounded-md bg-warning/10 border border-warning/20 mb-1">
                        <span className="text-lg">{item.menuItem.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.menuItem.name}</p>
                          <p className="text-xs text-muted-foreground">${(item.menuItem.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateTabItemQuantity(activeTab.id, item.menuItem.id, -1)}
                            className={`p-1 rounded hover:bg-muted ${totalQty <= sentQty ? "opacity-30 pointer-events-none" : ""}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => addItemToTab(activeTab.id, item.menuItem)} className="p-1 rounded hover:bg-muted">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => updateTabItemQuantity(activeTab.id, item.menuItem.id, -(item.quantity))}
                          className={`p-1 text-destructive hover:bg-destructive/10 rounded ${sentQty > 0 ? "opacity-30 pointer-events-none" : ""}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border/50 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${activeTab.total.toFixed(2)}</span>
              </div>

              {/* Send to kitchen button */}
              <Button
                className="w-full h-10"
                variant={hasUnsent ? "default" : "secondary"}
                onClick={handleSendToKitchen}
                disabled={!hasUnsent}
              >
                <Send className="w-4 h-4 mr-2" />
                {hasUnsent ? `Send ${unsentItems.reduce((s, i) => s + i.quantity, 0)} new items to Kitchen` : "All items sent ✓"}
              </Button>

              {/* Close & pay button */}
              <Button
                className="w-full h-10"
                variant="outline"
                onClick={() => { setPaymentMethod("cash"); setPayDialogTabId(activeTab.id); }}
                disabled={activeTab.items.length === 0}
              >
                <Banknote className="w-4 h-4 mr-2" /> Close & Pay Tab
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment dialog */}
      <Dialog open={!!payDialogTabId} onOpenChange={(open) => !open && setPayDialogTabId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Tab & Pay</DialogTitle>
            <DialogDescription>
              {payTab && (
                <>
                  {payTab.tableNumber ? `Table ${payTab.tableNumber}` : payTab.customerName || "Tab"} — Total: <strong>${payTab.total.toFixed(2)}</strong>
                  {getUnsentItems(payTab).length > 0 && (
                    <span className="block text-warning text-xs mt-1">⚠ Unsent items will also be sent to kitchen</span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "cash" as PaymentMethod, label: "Cash", icon: <Banknote className="w-6 h-6" /> },
                { value: "card" as PaymentMethod, label: "Card", icon: <CreditCard className="w-6 h-6" /> },
                { value: "transfer" as PaymentMethod, label: "Transfer", icon: <ArrowRightLeft className="w-6 h-6" /> },
              ]).map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg text-sm font-medium transition-all border ${
                    paymentMethod === pm.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                  }`}
                >
                  {pm.icon}
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogTabId(null)}>Cancel</Button>
            <Button onClick={handleCloseTab}>
              <Check className="w-4 h-4 mr-2" /> Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
