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
  sendToKitchen: (tabId: string) => void;
  closeTab: (tabId: string, paymentMethod: PaymentMethod) => void;
  deleteTab: (tabId: string) => void;
  getUnsentItems: (tab: Tab) => OrderItem[];
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

const recalcTotal = (items: OrderItem[]) => items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);

/** Returns items in `all` that are new/increased compared to `sent` */
const diffItems = (all: OrderItem[], sent: OrderItem[]): OrderItem[] => {
  const result: OrderItem[] = [];
  for (const item of all) {
    const sentItem = sent.find((s) => s.menuItem.id === item.menuItem.id);
    const sentQty = sentItem ? sentItem.quantity : 0;
    const diff = item.quantity - sentQty;
    if (diff > 0) result.push({ ...item, quantity: diff });
  }
  return result;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>(defaultMenu);
  const [orderCounter, setOrderCounter] = useState(1);

  const openTab = useCallback((tableNumber?: number, customerName?: string) => {
    const id = `tab-${tabCounter++}`;
    const newTab: Tab = { id, items: [], sentItems: [], total: 0, createdAt: new Date(), tableNumber, customerName };
    setTabs((prev) => [...prev, newTab]);
    return id;
  }, []);

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
        // Don't allow reducing below already-sent quantity
        const sentItem = tab.sentItems.find((s) => s.menuItem.id === itemId);
        const minQty = sentItem ? sentItem.quantity : 0;
        const newItems = tab.items
          .map((i) => (i.menuItem.id === itemId ? { ...i, quantity: Math.max(minQty, i.quantity + delta) } : i))
          .filter((i) => i.quantity > 0);
        return { ...tab, items: newItems, total: recalcTotal(newItems) };
      })
    );
  }, []);

  const updateTab = useCallback((tabId: string, updates: Partial<Pick<Tab, "tableNumber" | "customerName">>) => {
    setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)));
  }, []);

  const getUnsentItems = useCallback((tab: Tab): OrderItem[] => {
    return diffItems(tab.items, tab.sentItems);
  }, []);

  const sendToKitchen = useCallback((tabId: string) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab) return prev;
      const unsent = diffItems(tab.items, tab.sentItems);
      if (unsent.length === 0) return prev;

      // Create a kitchen order for unsent items
      const newOrder: Order = {
        id: `#${String(orderCounter).padStart(3, "0")}`,
        items: unsent,
        total: recalcTotal(unsent),
        status: "pending",
        createdAt: new Date(),
        tableNumber: tab.tableNumber,
        customerName: tab.customerName,
        paymentMethod: "cash", // placeholder, real payment set on close
        tabId: tab.id,
      };
      setOrders((o) => [newOrder, ...o]);
      setOrderCounter((c) => c + 1);

      // Mark all current items as sent
      return prev.map((t) =>
        t.id === tabId ? { ...t, sentItems: t.items.map((i) => ({ ...i })) } : t
      );
    });
  }, [orderCounter]);

  const closeTab = useCallback((tabId: string, paymentMethod: PaymentMethod) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab) return prev;

      // Send any remaining unsent items first
      const unsent = diffItems(tab.items, tab.sentItems);
      if (unsent.length > 0) {
        const newOrder: Order = {
          id: `#${String(orderCounter).padStart(3, "0")}`,
          items: unsent,
          total: recalcTotal(unsent),
          status: "pending",
          createdAt: new Date(),
          tableNumber: tab.tableNumber,
          customerName: tab.customerName,
          paymentMethod,
          tabId: tab.id,
        };
        setOrders((o) => [newOrder, ...o]);
        setOrderCounter((c) => c + 1);
      }

      // Update all orders from this tab with the final payment method
      setOrders((o) => o.map((order) => (order.tabId === tabId ? { ...order, paymentMethod } : order)));

      return prev.filter((t) => t.id !== tabId);
    });
  }, [orderCounter]);

  const deleteTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (tab && tab.sentItems.length > 0) return prev; // can't delete if items already sent
      return prev.filter((t) => t.id !== tabId);
    });
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
        openTab, addItemToTab, updateTabItemQuantity, updateTab,
        sendToKitchen, closeTab, deleteTab, getUnsentItems,
        updateOrderStatus, getOrdersByStatus, orderCounter,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
