import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChefHat, Package, Settings, BarChart3, Banknote } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-primary font-heading">🍽️ RestoPOS</h1>
        <p className="text-lg text-muted-foreground">El Tejaban de los antojos</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
          <Link to="/pos">
            <div className="glass-card p-6 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center h-full justify-center">
              <ShoppingCart className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-semibold">Ordenes</h2>
              <p className="text-xs text-muted-foreground mt-1">Tomar ordenes</p>
            </div>
          </Link>
          <Link to="/kitchen">
            <div className="glass-card p-6 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center h-full justify-center">
              <ChefHat className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-semibold">Kitchen</h2>

            </div>
          </Link>
          <Link to="/pickup">
            <div className="glass-card p-6 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center h-full justify-center">
              <Package className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-semibold">Pickup</h2>

            </div>
          </Link>
          <Link to="/checkout">
            <div className="glass-card p-6 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center h-full justify-center">
              <Banknote className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-semibold text-center mt-2">Caja</h2>
              <p className="text-xs text-muted-foreground mt-1 text-center">Cobrar cuentas</p>
            </div>
          </Link>
          <Link to="/accounting">
            <div className="glass-card p-6 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center h-full justify-center">
              <BarChart3 className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-semibold">Contabilidad</h2>
              <p className="text-xs text-muted-foreground mt-1">Recuento Diario</p>
            </div>
          </Link>
        </div>

        <Link to="/menu">
          <Button variant="outline" size="sm" className="mt-4">
            <Settings className="w-4 h-4 mr-1" /> Administrar Menu
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
