import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChefHat, Package } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-primary font-heading">🍽️ RestoPOS</h1>
        <p className="text-lg text-muted-foreground">Restaurant Point of Sale System</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          <Link to="/pos">
            <div className="glass-card p-6 hover:border-primary/50 transition-all cursor-pointer group">
              <ShoppingCart className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-semibold">Orders</h2>
              <p className="text-xs text-muted-foreground mt-1">Take orders</p>
            </div>
          </Link>
          <Link to="/kitchen">
            <div className="glass-card p-6 hover:border-primary/50 transition-all cursor-pointer group">
              <ChefHat className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-semibold">Kitchen</h2>
              <p className="text-xs text-muted-foreground mt-1">Prepare food</p>
            </div>
          </Link>
          <Link to="/pickup">
            <div className="glass-card p-6 hover:border-primary/50 transition-all cursor-pointer group">
              <Package className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h2 className="font-semibold">Pickup</h2>
              <p className="text-xs text-muted-foreground mt-1">Hand off orders</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
