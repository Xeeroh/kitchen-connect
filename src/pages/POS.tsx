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
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const POS = () => {
  const {
    menu, tabs, openTab, addItemToTab, updateTabItemQuantity,
    updateTab, sendToKitchen, closeTab, deleteTab, getUnsentItems,
  } = useOrders();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [deleteDialogTabId, setDeleteDialogTabId] = useState<string | null>(null);
  const [deleteNote, setDeleteNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [selectedSeat, setSelectedSeat] = useState<number>(1);

  const [showNewTab, setShowNewTab] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");

  const [fillingItem, setFillingItem] = useState<MenuItem | null>(null);
  const [activeFilling, setActiveFilling] = useState<string>("");
  const [mixtureParts, setMixtureParts] = useState<string[]>([]);

  const categoriesWithFillings = ["Flautas", "Tostadas", "Sopes", "Enchiladas", "Tacos"];
  const fillingOptions: Record<string, string[]> = {
    "Flautas": ["Pollo", "Carne"],
    "Tostadas": ["Mixta", "Pollo", "Carne", "Cueritos"],
    "Sopes": ["Chicharrón", "Pollo", "Carne", "Picadillo "],
    "Enchiladas": ["Pollo", "Carne", "Queso", "Cebolla"],
    "Quesadillas": ["Carne", "Chicharrón", "Rajas", "Queso", "Pollo"],
    "Tacos": ["Pollo", "Carne", "Papa"],
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const filteredItems = menu.filter((m) => m.category === activeCategory);
  const unsentItems = activeTab ? getUnsentItems(activeTab) : [];
  const hasUnsent = unsentItems.length > 0;

  const handleOpenTab = async () => {
    const id = await openTab(
      newTableNumber ? parseInt(newTableNumber) : undefined,
      newCustomerName || undefined
    );
    if (id) setActiveTabId(id);
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



  const handleDeleteTab = async () => {
    if (!deleteDialogTabId) return;

    await deleteTab(deleteDialogTabId, deleteNote);

    if (activeTabId === deleteDialogTabId) {
      const remainingOpen = tabs.filter(t => t.id !== deleteDialogTabId && t.status === 'open');
      setActiveTabId(remainingOpen.length > 0 ? remainingOpen[0].id : null);
    }

    setDeleteDialogTabId(null);
    setDeleteNote("");
    toast.success("Mesa eliminada correctamente");
  };

  // Check if an item has been sent (can't go below sent qty)
  const getSentQty = (itemId: string, notes?: string, seat?: number) => {
    if (!activeTab) return 0;
    const sent = activeTab.sentItems.find((s) =>
      s.menuItem.id === itemId &&
      (s.notes || '') === (notes || '') &&
      s.seat === seat
    );
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

      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-card/30 overflow-x-auto">
        {tabs.filter(t => t.status === 'open').map((tab) => {
          const tabUnsent = getUnsentItems(tab);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all group relative ${activeTabId === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              {tab.tableNumber ? `Mesa ${tab.tableNumber}` : tab.customerName || tab.id.replace("tab-", "Mesa #")}
              <span className="text-xs opacity-70">${tab.total.toFixed(2)}</span>
              {tabUnsent.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-warning absolute -top-0.5 -right-0.5" />
              )}
              <span
                onClick={(e) => { e.stopPropagation(); setDeleteDialogTabId(tab.id); }}
                className="p-0.5 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </span>
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
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border/30 bg-secondary/30">
          <Input placeholder="Mesa # (opcional)" value={newTableNumber} onChange={(e) => setNewTableNumber(e.target.value)} className="h-8 text-sm w-28" />
          <Input placeholder="Cliente (opcional)" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="h-8 text-sm flex-1 min-w-[140px]" />
          <Button size="sm" onClick={handleOpenTab}><Check className="w-3 h-3 mr-1" /> Abrir</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowNewTab(false)}><X className="w-3 h-3" /></Button>
        </div>
      )}

      {!activeTab ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Receipt className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">
              {tabs.length === 0 ? "No hay cuentas abiertas. Crea una para empezar." : "Selecciona una mesa para añadir productos."}
            </p>
            <Button variant="outline" onClick={() => setShowNewTab(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Abrir Nueva Mesa
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Menu area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Seat Selector */}
            <div className="flex items-center gap-3 p-3 bg-secondary/20 border-b border-border/30">
              <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                👥 Comensal:
              </span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedSeat(num)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border ${selectedSeat === num
                      ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg"
                      : "bg-background text-foreground border-border hover:bg-secondary/50"
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground ml-auto hidden sm:block italic">
                Cualquier pieza agregada al <b>Comensal {selectedSeat}</b> se agrupará para su descuento.
              </p>
            </div>

            <div className="flex gap-2 p-3 overflow-x-auto border-b border-border/30">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
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
                    onClick={() => {
                      if (categoriesWithFillings.includes(item.category)) {
                        setFillingItem(item);
                        setActiveFilling("");
                      } else {
                        addItemToTab(activeTab.id, item, undefined, selectedSeat);
                      }
                    }}
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
          <div className="w-full h-[45vh] lg:h-auto lg:w-80 lg:flex-none border-t lg:border-t-0 lg:border-l border-border/50 bg-card/30 flex flex-col">
            <div className="p-3 border-b border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {activeTab.tableNumber ? `Mesa ${activeTab.tableNumber}` : activeTab.customerName || "Cuenta Abierta"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {activeTab.items.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Mesa #"
                  value={activeTab.tableNumber?.toString() || ""}
                  onChange={(e) => updateTab(activeTab.id, { tableNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="h-7 text-xs w-20"
                />
                <Input
                  placeholder="Cliente"
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
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{item.menuItem.name}</p>
                          <span className="text-[9px] bg-primary/10 text-primary px-1 rounded font-bold">C{item.seat}</span>
                        </div>
                        {item.notes && <p className="text-[10px] text-primary italic font-bold">» {item.notes}</p>}
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
                  {unsentItems.map((item, idx) => {
                    const totalQty = activeTab.items.find((i) =>
                      i.menuItem.id === item.menuItem.id &&
                      (i.notes || '') === (item.notes || '') &&
                      i.seat === item.seat
                    )?.quantity || 0;
                    const sentQty = getSentQty(item.menuItem.id, item.notes, item.seat);
                    return (
                      <div key={`unsent-${item.menuItem.id}-${item.notes || idx}`} className="flex items-center gap-2 p-2 rounded-md bg-warning/10 border border-warning/20 mb-1">
                        <span className="text-lg">{item.menuItem.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">{item.menuItem.name}</p>
                            <span className="text-[9px] bg-warning/20 text-warning px-1 rounded font-bold border border-warning/30">C{item.seat}</span>
                          </div>
                          {item.notes && <p className="text-[10px] text-primary italic font-bold">» {item.notes}</p>}
                          <p className="text-xs text-muted-foreground">${(item.menuItem.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateTabItemQuantity(activeTab.id, item.menuItem.id, -1, item.notes, item.seat)}
                            className={`p-1 rounded hover:bg-muted ${totalQty <= sentQty ? "opacity-30 pointer-events-none" : ""}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => addItemToTab(activeTab.id, item.menuItem, item.notes, item.seat)} className="p-1 rounded hover:bg-muted">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => updateTabItemQuantity(activeTab.id, item.menuItem.id, -(item.quantity), item.notes, item.seat)}
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
                onClick={() => navigate(`/checkout?tabId=${activeTab.id}`)}
                disabled={activeTab.items.length === 0}
              >
                <Banknote className="w-4 h-4 mr-2" /> Cerrar Cuenta en Caja
              </Button>
            </div>
          </div>
        </div>
      )}



      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteDialogTabId} onOpenChange={(open) => !open && setDeleteDialogTabId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> ¿Eliminar esta mesa?
            </DialogTitle>
            <DialogDescription>
              Esta acción cerrará la mesa sin registrar formalmente un pago. Úsala solo para cancelaciones o errores.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Motivo de la eliminación (Opcional)</label>
            <Input
              placeholder="Ej: Cliente se fue molesto, error de digitación..."
              value={deleteNote}
              onChange={(e) => setDeleteNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogTabId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteTab}>
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar Mesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Filling Dialog */}
      <Dialog open={!!fillingItem} onOpenChange={(open) => !open && setFillingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Guisado</DialogTitle>
            <DialogDescription>
              {activeFilling === "Mixta"
                ? "Selecciona los ingredientes para la mezcla"
                : `Escoge el guisado para ${fillingItem?.name}`}
            </DialogDescription>
          </DialogHeader>

          {activeFilling === "Mixta" ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                {(fillingItem && fillingOptions[fillingItem.category] || [])
                  .filter(opt => opt !== "Mixta")
                  .map((opt) => {
                    const isSelected = mixtureParts.includes(opt);
                    return (
                      <Button
                        key={opt}
                        variant={isSelected ? "default" : "outline"}
                        className="h-12"
                        onClick={() => {
                          setMixtureParts(prev =>
                            prev.includes(opt)
                              ? prev.filter(p => p !== opt)
                              : [...prev, opt]
                          );
                        }}
                      >
                        {opt}
                      </Button>
                    );
                  })}
              </div>
              {mixtureParts.length > 0 && (
                <p className="text-sm font-medium text-center text-primary">
                  Mezcla: {mixtureParts.join(" con ")}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 py-4">
              {(fillingItem && fillingOptions[fillingItem.category] || []).map((opt) => (
                <Button
                  key={opt}
                  variant={activeFilling === opt ? "default" : "outline"}
                  className="h-12"
                  onClick={() => {
                    setActiveFilling(opt);
                    if (opt !== "Mixta") setMixtureParts([]);
                  }}
                >
                  {opt}
                </Button>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setFillingItem(null);
              setActiveFilling("");
              setMixtureParts([]);
            }}>
              Cancelar
            </Button>
            <Button
              disabled={!activeFilling || (activeFilling === "Mixta" && mixtureParts.length < 2)}
              onClick={() => {
                if (activeTabId && fillingItem) {
                  const finalNote = activeFilling === "Mixta"
                    ? `Mixta (${mixtureParts.join(" y ")})`
                    : activeFilling;
                  addItemToTab(activeTabId, fillingItem, finalNote, selectedSeat);
                  setFillingItem(null);
                  setActiveFilling("");
                  setMixtureParts([]);
                }
              }}
            >
              {activeFilling === "Mixta" ? "Confirmar Mezcla" : "Añadir a la Cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
