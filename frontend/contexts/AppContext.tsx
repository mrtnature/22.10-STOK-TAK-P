import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  initDatabase,
  getAllStockItems,
  getAllTemplates,
  getAllCustomers,
  getAllOrders,
  getAllNotifications,
  getUnreadNotificationCount,
  StockItem,
  Template,
  Customer,
  Notification,
} from '../lib/database';

interface AppContextType {
  stockItems: StockItem[];
  templates: Template[];
  customers: Customer[];
  orders: any[];
  notifications: Notification[];
  unreadCount: number;
  refreshStock: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await initDatabase();
      await refreshAll();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const refreshStock = async () => {
    try {
      const items = await getAllStockItems();
      setStockItems(items);
    } catch (error) {
      console.error('Error refreshing stock:', error);
    }
  };

  const refreshTemplates = async () => {
    try {
      const temps = await getAllTemplates();
      setTemplates(temps);
    } catch (error) {
      console.error('Error refreshing templates:', error);
    }
  };

  const refreshCustomers = async () => {
    try {
      const custs = await getAllCustomers();
      setCustomers(custs);
    } catch (error) {
      console.error('Error refreshing customers:', error);
    }
  };

  const refreshOrders = async () => {
    try {
      const ords = await getAllOrders();
      setOrders(ords);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  };

  const refreshNotifications = async () => {
    try {
      const notifs = await getAllNotifications();
      setNotifications(notifs);
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      refreshStock(),
      refreshTemplates(),
      refreshCustomers(),
      refreshOrders(),
      refreshNotifications(),
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        stockItems,
        templates,
        customers,
        orders,
        notifications,
        unreadCount,
        refreshStock,
        refreshTemplates,
        refreshCustomers,
        refreshOrders,
        refreshNotifications,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
