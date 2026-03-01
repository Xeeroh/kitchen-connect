import React, { createContext, useContext, useState, useCallback } from "react";
import { Order, OrderItem, OrderStatus, defaultMenu, MenuItem } from "@/data/menu";

interface OrderContextType {
  orders: Order[];
  menu: MenuItem[];
  setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  addOrder: (items: OrderItem[], tableNumber?: number, customerName?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  orderCounter: number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>(defaultMenu);
  const [orderCounter, setOrderCounter] = useState(1);

  const addOrder = useCallback((items: OrderItem[], tableNumber?: number, customerName?: string) => {
    const total = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
    const newOrder: Order = {
      id: `#${String(orderCounter).padStart(3, "0")}`,
      items,
      total,
      status: "pending",
      createdAt: new Date(),
      tableNumber,
      customerName,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setOrderCounter((c) => c + 1);
  }, [orderCounter]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }, []);

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => orders.filter((o) => o.status === status),
    [orders]
  );

  return (
    <OrderContext.Provider value={{ orders, menu, setMenu, addOrder, updateOrderStatus, getOrdersByStatus, orderCounter }}>
      {children}
    </OrderContext.Provider>
  );
};
