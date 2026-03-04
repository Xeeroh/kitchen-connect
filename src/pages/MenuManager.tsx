import { useState } from "react";
import { useOrders } from "@/contexts/OrderContext";
import { categories, MenuItem } from "@/data/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Save, X, Settings } from "lucide-react";
import { toast } from "sonner";

const MenuManager = () => {
  const { menu, addMenuItem, updateMenuItem, deleteMenuItem } = useOrders();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", category: categories[0], emoji: "🍽️" });
  const [filterCat, setFilterCat] = useState<string>("All");

  const resetForm = () => {
    setForm({ name: "", price: "", category: categories[0], emoji: "🍽️" });
    setEditingId(null);
    setShowAdd(false);
  };

  const handleSave = () => {
    const name = form.name.trim();
    const price = parseFloat(form.price);
    if (!name || name.length > 100) { toast.error("Name is required (max 100 chars)"); return; }
    if (isNaN(price) || price <= 0 || price > 9999) { toast.error("Enter a valid price (0-9999)"); return; }
    const emoji = form.emoji.trim() || "🍽️";

    if (editingId) {
      updateMenuItem(editingId, { name, price, category: form.category, emoji });
      toast.success("Producto actualizado");
    } else {
      addMenuItem({ name, price, category: form.category, emoji });
      toast.success("Producto añadido");
    }
    resetForm();
  };

  const startEdit = (item: MenuItem) => {
    setForm({ name: item.name, price: String(item.price), category: item.category, emoji: item.emoji });
    setEditingId(item.id);
    setShowAdd(true);
  };

  const deleteItem = (id: string) => {
    deleteMenuItem(id);
    toast.success("Producto eliminado");
  };

  const filtered = filterCat === "All" ? menu : menu.filter((m) => m.category === filterCat);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-primary font-heading">Gestión del Menú</span>
        </div>
        <div className="flex gap-2">
          <Link to="/"><Button variant="outline" size="sm">Inicio</Button></Link>
          <Link to="/pos"><Button variant="outline" size="sm">POS</Button></Link>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-3xl mx-auto w-full space-y-4">
        {/* Add / Edit form */}
        {showAdd ? (
          <div className="glass-card p-4 space-y-3 animate-slide-in">
            <h3 className="font-semibold">{editingId ? "Editar Producto" : "Nuevo Producto"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nombre" value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Precio" type="number" step="0.01" min="0" max="9999" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <Input placeholder="Emoji" value={form.emoji} maxLength={4} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}><Save className="w-4 h-4 mr-1" />{editingId ? "Actualizar" : "Añadir"}</Button>
              <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-1" />Cancelar</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" />Añadir Producto</Button>
        )}

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterCat === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left p-3">Producto</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-right p-3">Precio</th>
                <th className="text-right p-3 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="p-3 font-medium">{item.emoji} {item.name}</td>
                  <td className="p-3 text-muted-foreground">{item.category}</td>
                  <td className="p-3 text-right text-primary font-semibold">${item.price.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded hover:bg-destructive/20 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay productos en esta categoría</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MenuManager;
