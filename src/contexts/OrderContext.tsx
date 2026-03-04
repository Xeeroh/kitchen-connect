import React, { createContext, useContext, useState, useCallback } from "react";
import { Order, OrderItem, OrderStatus, PaymentMethod, Tab, defaultMenu, MenuItem } from "@/data/menu";

interface OrderContextType {
  orders: Order[];
  tabs: Tab[];
  menu: MenuItem[];
  setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  openTab: (tableNumber?: number, customerName?: string) => string;
  addItemToTab: (tabId: string, item: MenuItem) => void;
  updateTabItemQuantity: (tabId: string, itemId: string, delta: number) => void;
  updateTab: (tabId: string, updates: Partial<Pick<Tab, "tableNumber" | "customerName">>) => void;
  closeTab: (tabId: string, paymentMethod: PaymentMethod) => void;
  deleteTab: (tabId: string) => void;
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

let tabCounter = 1;

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>(defaultMenu);
  const [orderCounter, setOrderCounter] = useState(1);

  const openTab = useCallback((tableNumber?: number, customerName?: string) => {
    const id = `tab-${tabCounter++}`;
    const newTab: Tab = { id, items: [], total: 0, createdAt: new Date(), tableNumber, customerName };
    setTabs((prev) => [...prev, newTab]);
    return id;
  }, []);

  const recalcTotal = (items: OrderItem[]) => items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);

  const addItemToTab = useCallback((tabId: string, item: MenuItem) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        const existing = tab.items.find((i) => i.menuItem.id === item.id);
        const newItems = existing
          ? tab.items.map((i) => (i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
          : [...tab.items, { menuItem: item, quantity: 1 }];
        return { ...tab, items: newItems, total: recalcTotal(newItems) };
      })
    );
  }, []);

  const updateTabItemQuantity = useCallback((tabId: string, itemId: string, delta: number) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        const newItems = tab.items
          .map((i) => (i.menuItem.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
          .filter((i) => i.quantity > 0);
        return { ...tab, items: newItems, total: recalcTotal(newItems) };
      })
    );
  }, []);

  const updateTab = useCallback((tabId: string, updates: Partial<Pick<Tab, "tableNumber" | "customerName">>) => {
    setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)));
  }, []);

  const closeTab = useCallback((tabId: string, paymentMethod: PaymentMethod) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab || tab.items.length === 0) return prev;

      const newOrder: Order = {
        id: `#${String(orderCounter).padStart(3, "0")}`,
        items: tab.items,
        total: tab.total,
        status: "pending",
        createdAt: tab.createdAt,
        tableNumber: tab.tableNumber,
        customerName: tab.customerName,
        paymentMethod,
      };
      setOrders((o) => [newOrder, ...o]);
      setOrderCounter((c) => c + 1);

      return prev.filter((t) => t.id !== tabId);
    });
  }, [orderCounter]);

  const deleteTab = useCallback((tabId: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }, []);

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => orders.filter((o) => o.status === status),
    [orders]
  );

  return (
    <OrderContext.Provider
      value={{
        orders, tabs, menu, setMenu,
        openTab, addItemToTab, updateTabItemQuantity, updateTab, closeTab, deleteTab,
        updateOrderStatus, getOrdersByStatus, orderCounter,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
