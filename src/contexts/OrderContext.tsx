import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Order, OrderItem, OrderStatus, PaymentMethod, Tab, MenuItem } from "@/data/menu";
import { Database } from "@/types/supabase";
import { toast } from "sonner";

type DBTab = Database["public"]["Tables"]["tabs"]["Row"];
type DBTabItem = Database["public"]["Tables"]["tab_items"]["Row"];
type DBMenu = Database["public"]["Tables"]["menu_items"]["Row"];

interface OrderContextType {
  orders: Order[];
  tabs: Tab[];
  menu: MenuItem[];
  setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  openTab: (tableNumber?: number, customerName?: string) => Promise<string>;
  addItemToTab: (tabId: string, item: MenuItem, notes?: string) => void;
  updateTabItemQuantity: (tabId: string, itemId: string, delta: number, notes?: string) => void;
  updateTab: (tabId: string, updates: Partial<Pick<Tab, "tableNumber" | "customerName">>) => void;
  sendToKitchen: (tabId: string) => Promise<void>;
  closeTab: (tabId: string, paymentMethod: PaymentMethod) => Promise<void>;
  deleteTab: (tabId: string, note?: string) => Promise<void>;
  getUnsentItems: (tab: Tab) => OrderItem[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  addMenuItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  orderCounter: number; // No longer highly accurate for distributed but kept for UI compat
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};

const calculateSmartPrice = (qty: number, piecePrice: number, bundles: Record<number, number>) => {
  let total = 0;
  let remaining = qty;
  const bundleQtys = Object.keys(bundles).map(Number).sort((a, b) => b - a);

  for (const bQty of bundleQtys) {
    const num = Math.floor(remaining / bQty);
    total += num * bundles[bQty];
    remaining %= bQty;
  }
  total += remaining * piecePrice;
  return total;
};

const recalcTotal = (items: OrderItem[]) => {
  const bundleRules: Record<string, { piecePrice: number, bundles: Record<number, number> }> = {
    "Flauta Pieza": { piecePrice: 35, bundles: { 3: 85, 4: 95, 6: 110 } },
    "Enchilada pieza": { piecePrice: 35, bundles: { 3: 85, 4: 95, 6: 110 } },
    "Taco Dorado pieza": { piecePrice: 35, bundles: { 3: 85, 4: 95, 6: 110 } },
    "Sope Sencillo (Pieza)": { piecePrice: 45, bundles: { 3: 110 } },
    "Sope de Chicharrón (Pieza)": { piecePrice: 50, bundles: { 3: 125 } }
  };

  const counts: Record<string, number> = {};
  let otherTotal = 0;

  items.forEach(item => {
    const name = item.menuItem.name;
    // Normalize name for lookup if it's already a bundle from previous messy data
    let baseName = name;
    let multiplier = 1;

    if (name.includes("(Orden de 3)")) { multiplier = 3; baseName = name.split(" (")[0].replace("Flautas", "Flauta Pieza").replace("Enchiladas", "Enchilada pieza").replace("Tacos dorado", "Taco Dorado pieza").replace("Sopes Sencillos", "Sope Sencillo (Pieza)").replace("Sopes con Chicharrón", "Sope de Chicharrón (Pieza)"); }
    else if (name.includes("(Orden de 4)")) { multiplier = 4; baseName = name.split(" (")[0].replace("Flautas", "Flauta Pieza").replace("Enchiladas", "Enchilada pieza").replace("Tacos dorado", "Taco Dorado pieza"); }
    else if (name.includes("(Orden de 6)")) { multiplier = 6; baseName = name.split(" (")[0].replace("Flautas", "Flauta Pieza").replace("Enchiladas", "Enchilada pieza").replace("Tacos dorado", "Taco Dorado pieza"); }

    const rule = Object.entries(bundleRules).find(([k]) => k.toLowerCase() === baseName.toLowerCase() || k.toLowerCase().startsWith(baseName.toLowerCase().split(' ')[0]));

    if (rule) {
      counts[rule[0]] = (counts[rule[0]] || 0) + (item.quantity * multiplier);
    } else {
      otherTotal += item.menuItem.price * item.quantity;
    }
  });

  let bundleTotal = 0;
  Object.entries(counts).forEach(([name, qty]) => {
    const rule = bundleRules[name];
    bundleTotal += calculateSmartPrice(qty, rule.piecePrice, rule.bundles);
  });

  return otherTotal + bundleTotal;
};

const diffItems = (all: OrderItem[], sent: OrderItem[]): OrderItem[] => {
  const result: OrderItem[] = [];
  for (const item of all) {
    // We must match on BOTH ID and exact notes
    const sentItem = sent.find((s) =>
      s.menuItem.id === item.menuItem.id &&
      (s.notes || '') === (item.notes || '')
    );
    const sentQty = sentItem ? sentItem.quantity : 0;
    const diff = item.quantity - sentQty;
    if (diff > 0) result.push({ ...item, quantity: diff });
  }
  return result;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbTabs, setDbTabs] = useState<DBTab[]>([]);
  const [dbTabItems, setDbTabItems] = useState<DBTabItem[]>([]);
  const [dbMenu, setDbMenu] = useState<DBMenu[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orderCounter, setOrderCounter] = useState(1);

  // FETCH & SUBSCRIBE to Supabase Realtime
  useEffect(() => {
    const fetchInitialData = async () => {
      // Menu
      const { data: menuData } = await supabase.from('menu_items').select('*').eq('is_available', true);
      if (menuData) setDbMenu(menuData);

      // Download Tabs (Open & Closed for accounting)
      const { data: tabsData } = await supabase.from('tabs').select('*').in('status', ['open', 'closed']);
      if (tabsData) {
        setDbTabs(tabsData);
        // Fetch items for these tabs
        if (tabsData.length > 0) {
          const tabIds = tabsData.map(t => t.id);
          const { data: itemsData } = await supabase.from('tab_items').select('*').in('tab_id', tabIds);
          if (itemsData) setDbTabItems(itemsData);
        }
      }
    };

    fetchInitialData();

    // Subscribe to Channels
    const menuChannel = supabase.channel('menu_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        supabase.from('menu_items').select('*').eq('is_available', true).then(({ data }) => setDbMenu(data || []));
      }).subscribe();

    const tabsChannel = supabase.channel('tabs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tabs' }, () => {
        supabase.from('tabs').select('*').in('status', ['open', 'closed']).then(({ data }) => setDbTabs(data || []));
      }).subscribe();

    const itemsChannel = supabase.channel('tab_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tab_items' }, () => {
        const tabIds = dbTabs.map(t => t.id);
        if (tabIds.length > 0) {
          supabase.from('tab_items').select('*').in('tab_id', tabIds).then(({ data }) => setDbTabItems(data || []));
        } else {
          supabase.from('tab_items').select('*').then(({ data }) => setDbTabItems(data || []));
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(tabsChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [dbTabs.length]); // re-bind list if root tabs change significantly, though a simpler generic fetch on any item change is safe

  // Update local menu mapping
  useEffect(() => {
    setMenu(dbMenu.map(d => ({
      id: d.id, name: d.name, price: d.price, category: d.category, emoji: d.emoji
    })));
  }, [dbMenu]);

  // DERIVE `tabs` for UI from dbTabs and dbTabItems
  const tabs: Tab[] = useMemo(() => {
    return dbTabs.map(dbTab => {
      const allItemsForTab = dbTabItems.filter(i => i.tab_id === dbTab.id);

      // We aggregate quantities locally so the POS view is identical to before
      const mergedItems: OrderItem[] = [];
      const mergedSentItems: OrderItem[] = [];

      allItemsForTab.forEach(dbItem => {
        const menuItem = menu.find(m => m.id === dbItem.menu_item_id);
        if (!menuItem) return;

        // Total Items logic (Pending + Sent + Ready + Served)
        const existingAll = mergedItems.find(i => i.menuItem.id === menuItem.id && (i.notes || '') === (dbItem.notes || ''));
        if (existingAll) {
          existingAll.quantity += dbItem.quantity;
        } else {
          mergedItems.push({ menuItem, quantity: dbItem.quantity, notes: dbItem.notes || undefined });
        }

        // Sent Items logic (Sent + Ready + Served)
        if (dbItem.status !== 'pending') {
          const existingSent = mergedSentItems.find(i => i.menuItem.id === menuItem.id && (i.notes || '') === (dbItem.notes || ''));
          if (existingSent) {
            existingSent.quantity += dbItem.quantity;
          } else {
            mergedSentItems.push({ menuItem, quantity: dbItem.quantity, notes: dbItem.notes || undefined });
          }
        }
      });

      return {
        id: dbTab.id,
        items: mergedItems,
        sentItems: mergedSentItems,
        total: Number(dbTab.total) || recalcTotal(mergedItems),
        createdAt: new Date(dbTab.created_at),
        status: dbTab.status,
        tableNumber: dbTab.table_number || undefined,
        customerName: dbTab.customer_name || undefined
      };
    }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [dbTabs, dbTabItems, menu]);

  // DERIVE `orders` for KITCHEN from dbTabItems grouped by timestamp
  const orders: Order[] = useMemo(() => {
    const ordersMap: Record<string, Order> = {};

    // Only map items that are sent, ready, or served (Kitchen & Pickup look at these)
    dbTabItems.forEach(dbItem => {
      if (dbItem.status === 'pending') return;

      const menuItem = menu.find(m => m.id === dbItem.menu_item_id);
      if (!menuItem) return;

      const tab = dbTabs.find(t => t.id === dbItem.tab_id);
      if (!tab || tab.status !== 'open') return;

      // Group by tab_id + exactly identical timestamp created_at = unique dispatch to kitchen
      const orderId = `${dbItem.tab_id}_${new Date(dbItem.created_at).getTime()}`;

      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          id: orderId,
          items: [],
          total: 0,
          status: dbItem.status as OrderStatus,
          createdAt: new Date(dbItem.created_at),
          tableNumber: tab?.table_number || undefined,
          customerName: tab?.customer_name || undefined,
          paymentMethod: (tab?.payment_method as PaymentMethod) || 'cash',
          tabId: dbItem.tab_id
        };
      }

      ordersMap[orderId].items.push({ menuItem, quantity: dbItem.quantity, notes: dbItem.notes || undefined });
      ordersMap[orderId].total += (menuItem.price * dbItem.quantity);
      // Let the newest item define the overall worst-case status, though they should be identical
    });

    return Object.values(ordersMap).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }, [dbTabItems, dbTabs, menu]);


  // ACTIONS
  const openTab = useCallback(async (tableNumber?: number, customerName?: string) => {
    let finalTableNumber = tableNumber;

    // If no table number provided, find the next available sequential one that isn't currently open
    if (!finalTableNumber && !customerName) {
      const activeNumbers = dbTabs.map(t => t.table_number).filter(n => n !== null) as number[];
      let next = 1;
      while (activeNumbers.includes(next)) {
        next++;
      }
      finalTableNumber = next;
    }

    const { data } = await supabase.from('tabs').insert({
      table_number: finalTableNumber || null,
      customer_name: customerName || null,
      status: 'open',
      total: 0
    }).select().single();

    if (data) {
      setDbTabs(prev => [...prev, data]);
      return data.id;
    }
    return '';
  }, [dbTabs]);

  const addItemToTab = useCallback(async (tabId: string, item: MenuItem, notes?: string) => {
    // 1. Initial Insert/Update
    const existingPending = dbTabItems.find(i =>
      i.tab_id === tabId &&
      i.menu_item_id === item.id &&
      i.status === 'pending' &&
      (i.notes || '') === (notes || '')
    );

    let currentItem: DBTabItem | null = null;

    if (existingPending) {
      const { data } = await supabase.from('tab_items').update({ quantity: existingPending.quantity + 1 }).eq('id', existingPending.id).select();
      if (data && data[0]) {
        currentItem = data[0];
        setDbTabItems(prev => prev.map(i => i.id === existingPending.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
    } else {
      const { data } = await supabase.from('tab_items').insert({
        tab_id: tabId,
        menu_item_id: item.id,
        quantity: 1,
        status: 'pending',
        notes: notes || null
      }).select().single();
      if (data) {
        currentItem = data;
        setDbTabItems(prev => [...prev, data]);
      }
    }

    setOrderCounter(c => c + 1);
  }, [dbTabItems, menu]);

  const updateTabItemQuantity = useCallback(async (tabId: string, itemId: string, delta: number, notes?: string) => {
    // Only pending items can change quantity freely. Sent items are immutable from POS in this flow.
    const existingPending = dbTabItems.find(i =>
      i.tab_id === tabId &&
      i.menu_item_id === itemId &&
      i.status === 'pending' &&
      (i.notes || '') === (notes || '')
    );

    if (existingPending) {
      const newQty = existingPending.quantity + delta;
      if (newQty <= 0) {
        await supabase.from('tab_items').delete().eq('id', existingPending.id);
        setDbTabItems(prev => prev.filter(i => i.id !== existingPending.id));
      } else {
        await supabase.from('tab_items').update({ quantity: newQty }).eq('id', existingPending.id);
        setDbTabItems(prev => prev.map(i => i.id === existingPending.id ? { ...i, quantity: newQty } : i));
      }
    }
  }, [dbTabItems]);

  const updateTab = useCallback(async (tabId: string, updates: Partial<Pick<Tab, "tableNumber" | "customerName">>) => {
    const payload: any = {};
    if (updates.tableNumber !== undefined) payload.table_number = updates.tableNumber || null;
    if (updates.customerName !== undefined) payload.customer_name = updates.customerName || null;
    await supabase.from('tabs').update(payload).eq('id', tabId);
    setDbTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...payload } : t));
  }, []);

  const getUnsentItems = useCallback((tab: Tab): OrderItem[] => {
    return diffItems(tab.items, tab.sentItems);
  }, []);

  const sendToKitchen = useCallback(async (tabId: string) => {
    // Update all 'pending' items to 'sent' AND update their created_at to group them
    const pendingItems = dbTabItems.filter(i => i.tab_id === tabId && i.status === 'pending');
    if (pendingItems.length === 0) return;

    const ids = pendingItems.map(i => i.id);
    const now = new Date().toISOString();

    setDbTabItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, status: 'sent', created_at: now } : i));
    await supabase.from('tab_items').update({ status: 'sent', created_at: now }).in('id', ids);
  }, [dbTabItems]);

  const closeTab = useCallback(async (tabId: string, paymentMethod: PaymentMethod) => {
    const tabObj = tabs.find(t => t.id === tabId);
    const total = tabObj ? tabObj.total : 0;

    // Auto-send anything left cart -> sent (kitchen)
    const pendingItems = dbTabItems.filter(i => i.tab_id === tabId && i.status === 'pending');
    if (pendingItems.length > 0) {
      await sendToKitchen(tabId);
    }

    setDbTabs(prev => prev.filter(t => t.id !== tabId));
    // Mark the tab as closed
    await supabase.from('tabs').update({ status: 'closed', payment_method: paymentMethod, total }).eq('id', tabId);
    // Mark all items for this tab as served
    await supabase.from('tab_items').update({ status: 'served' }).eq('tab_id', tabId);
  }, [tabs, dbTabItems, sendToKitchen]);

  const deleteTab = useCallback(async (tabId: string, note?: string) => {
    setDbTabs(prev => prev.filter(t => t.id !== tabId));
    setDbTabItems(prev => prev.filter(i => i.tab_id !== tabId));

    // Physical delete from DB so they disappear everywhere
    await supabase.from('tab_items').delete().eq('tab_id', tabId);
    await supabase.from('tabs').delete().eq('id', tabId);

    toast.success("Cuenta eliminada correctamente");
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    // orderId looks like "tabId_milliseconds". We need to find all items matching this.
    // The safest is finding items that construct this exact orderId.
    const itemsToUpdate = dbTabItems.filter(i => `${i.tab_id}_${new Date(i.created_at).getTime()}` === orderId);
    const ids = itemsToUpdate.map(i => i.id);
    if (ids.length > 0) {
      setDbTabItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, status: status as any } : i));
      await supabase.from('tab_items').update({ status }).in('id', ids);
    }
  }, [dbTabItems]);

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => orders.filter((o) => o.status === status),
    [orders]
  );

  const addMenuItem = useCallback(async (item: Omit<MenuItem, "id">) => {
    await supabase.from('menu_items').insert({
      name: item.name,
      price: item.price,
      category: item.category,
      emoji: item.emoji,
      is_available: true
    });
  }, []);

  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.category) payload.category = updates.category;
    if (updates.emoji) payload.emoji = updates.emoji;

    await supabase.from('menu_items').update(payload).eq('id', id);
  }, []);

  const deleteMenuItem = useCallback(async (id: string) => {
    // We do a logical delete by setting is_available to false
    await supabase.from('menu_items').update({ is_available: false }).eq('id', id);
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orders, tabs, menu, setMenu,
        openTab, addItemToTab, updateTabItemQuantity, updateTab,
        sendToKitchen, closeTab, deleteTab, getUnsentItems,
        updateOrderStatus, getOrdersByStatus, orderCounter,
        addMenuItem, updateMenuItem, deleteMenuItem
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
