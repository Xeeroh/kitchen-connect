import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Banknote, Landmark, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/contexts/OrderContext";
import { PaymentMethod, Tab } from "@/data/menu";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Checkout = () => {
  const { tabs, orders, closeTab } = useOrders();
  const { toast } = useToast();
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  // A tab is consider ready for checkout if it's open and has at least one item
  const readyTabs = tabs.filter((tab) => tab.status === 'open' && tab.items.length > 0);

  const selectedTab = tabs.find((t) => t.id === selectedTabId);

  const handleCloseTab = () => {
    if (!selectedTab) return;
    closeTab(selectedTab.id, paymentMethod);
    toast({
      title: "Cuenta Cerrada",
      description: `La cuenta de la Mesa ${selectedTab.tableNumber || selectedTab.customerName || "N/A"} ha sido pagada.`,
    });
    setSelectedTabId(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <Banknote className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-primary font-heading">Caja</span>
        </div>
        <div className="flex gap-2">
          <Link to="/"><Button variant="outline" size="sm">Inicio</Button></Link>
          <Link to="/pos"><Button variant="outline" size="sm">POS</Button></Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Left Column: List of Ready Tabs */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold">Cuentas Listas ({readyTabs.length})</h2>
            <div className="space-y-3">
              {readyTabs.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground bg-slate-50/10 rounded-lg border border-dashed">
                  No hay cuentas listas para cobrar.
                </div>
              ) : (
                readyTabs.map((tab) => (
                  <Card
                    key={tab.id}
                    className={`cursor-pointer transition-all ${selectedTabId === tab.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                    onClick={() => setSelectedTabId(tab.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{tab.tableNumber ? `Mesa ${tab.tableNumber}` : tab.customerName || "Para Llevar"}</CardTitle>
                        <span className="font-semibold text-lg text-green-600">${tab.total.toFixed(2)}</span>
                      </div>
                      <CardDescription>{tab.customerName || "Sin nombre"}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground">{tab.items.length} artículos</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Checkout Details */}
          <div className="lg:col-span-2">
            {selectedTab ? (
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl flex justify-between">
                    <span>Cerrar Cuenta - {selectedTab.tableNumber ? `Mesa ${selectedTab.tableNumber}` : selectedTab.customerName || "Pedido"}</span>
                    <span>${selectedTab.total.toFixed(2)}</span>
                  </CardTitle>
                  <CardDescription>
                    Cliente: {selectedTab.customerName || "No especificado"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  {/* Order Summary */}
                  <div>
                    <h3 className="font-medium mb-3">Resumen de Consumo</h3>
                    <div className="space-y-2 bg-slate-50/10 p-4 rounded-md border">
                      {selectedTab.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.menuItem.name} {item.menuItem.emoji}
                          </span>
                          <span>${(item.quantity * item.menuItem.price).toFixed(2)}</span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total a Pagar</span>
                        <span>${selectedTab.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <h3 className="font-medium mb-3">Método de Pago</h3>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                        <Label
                          htmlFor="cash"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Banknote className="mb-3 h-6 w-6" />
                          Efectivo
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="card" id="card" className="peer sr-only" />
                        <Label
                          htmlFor="card"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <CreditCard className="mb-3 h-6 w-6" />
                          Tarjeta
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="transfer" id="transfer" className="peer sr-only" />
                        <Label
                          htmlFor="transfer"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Landmark className="mb-3 h-6 w-6" />
                          Transferencia
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter className="pt-6 border-t">
                  <Button
                    className="w-full h-14 text-lg"
                    size="lg"
                    onClick={handleCloseTab}
                  >
                    <CheckCircle2 className="mr-2 h-6 w-6" />
                    Registrar Venta y Cobrar ${selectedTab.total.toFixed(2)}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/10">
                <Banknote className="h-16 w-16 mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900">Selecciona una cuenta</h3>
                <p>Haz clic en una de las cuentas de la izquierda para ver el desglose y procesar el pago.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
