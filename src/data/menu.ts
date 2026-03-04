export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export type PaymentMethod = "cash" | "card" | "transfer";

export type OrderStatus = "pending" | "preparing" | "ready" | "picked_up";

export interface Tab {
  id: string;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  tableNumber?: number;
  customerName?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  tableNumber?: number;
  customerName?: string;
  paymentMethod: PaymentMethod;
}

export const categories = ["Starters", "Mains", "Sides", "Drinks", "Desserts"];

export const defaultMenu: MenuItem[] = [
  { id: "1", name: "Bruschetta", price: 8.5, category: "Starters", emoji: "🍞" },
  { id: "2", name: "Soup of the Day", price: 7.0, category: "Starters", emoji: "🍜" },
  { id: "3", name: "Caesar Salad", price: 9.0, category: "Starters", emoji: "🥗" },
  { id: "4", name: "Garlic Bread", price: 5.5, category: "Starters", emoji: "🧄" },
  { id: "5", name: "Grilled Salmon", price: 22.0, category: "Mains", emoji: "🐟" },
  { id: "6", name: "Ribeye Steak", price: 28.0, category: "Mains", emoji: "🥩" },
  { id: "7", name: "Chicken Parmesan", price: 18.0, category: "Mains", emoji: "🍗" },
  { id: "8", name: "Margherita Pizza", price: 15.0, category: "Mains", emoji: "🍕" },
  { id: "9", name: "Pasta Carbonara", price: 16.0, category: "Mains", emoji: "🍝" },
  { id: "10", name: "Veggie Burger", price: 14.0, category: "Mains", emoji: "🍔" },
  { id: "11", name: "French Fries", price: 5.0, category: "Sides", emoji: "🍟" },
  { id: "12", name: "Coleslaw", price: 4.0, category: "Sides", emoji: "🥬" },
  { id: "13", name: "Onion Rings", price: 6.0, category: "Sides", emoji: "🧅" },
  { id: "14", name: "Water", price: 2.0, category: "Drinks", emoji: "💧" },
  { id: "15", name: "Soda", price: 3.0, category: "Drinks", emoji: "🥤" },
  { id: "16", name: "Iced Tea", price: 3.5, category: "Drinks", emoji: "🧊" },
  { id: "17", name: "Coffee", price: 3.0, category: "Drinks", emoji: "☕" },
  { id: "18", name: "Tiramisu", price: 9.0, category: "Desserts", emoji: "🍰" },
  { id: "19", name: "Chocolate Cake", price: 8.0, category: "Desserts", emoji: "🎂" },
  { id: "20", name: "Ice Cream", price: 6.0, category: "Desserts", emoji: "🍦" },
];
