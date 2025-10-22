import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { format } from 'date-fns';

export interface StockItem {
  id: number;
  name: string;
  sku: string;
  unit: string;
  critical_qty: number;
  on_hand_qty: number;
  avg_cost: number;
  created_at: string;
  updated_at: string;
}

export interface StockMove {
  id: number;
  item_id: number;
  move_type: 'IN' | 'OUT';
  qty: number;
  unit_price: number;
  supplier: string;
  move_date: string;
  note: string;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateItem {
  id: number;
  template_id: number;
  item_id: number;
  qty: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  template_id: number;
  status: 'ordered' | 'production' | 'shipped' | 'completed';
  sale_price: number;
  shipper: string;
  tracking_code: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

let db: SQLite.SQLiteDatabase;

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('erpstok.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS stock_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT,
      unit TEXT NOT NULL,
      critical_qty REAL DEFAULT 0,
      on_hand_qty REAL DEFAULT 0,
      avg_cost REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS stock_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      move_type TEXT NOT NULL,
      qty REAL NOT NULL,
      unit_price REAL NOT NULL,
      supplier TEXT,
      move_date TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES stock_items(id)
    );
    
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS template_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      qty REAL NOT NULL,
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES stock_items(id)
    );
    
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      template_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      sale_price REAL NOT NULL,
      shipper TEXT,
      tracking_code TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );
    
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    );
  `);
  
  return db;
};

export const getDb = () => db;

// Stock Operations
export const getAllStockItems = async (): Promise<StockItem[]> => {
  return await db.getAllAsync('SELECT * FROM stock_items ORDER BY name ASC');
};

export const getStockItem = async (id: number): Promise<StockItem | null> => {
  return await db.getFirstAsync('SELECT * FROM stock_items WHERE id = ?', [id]);
};

export const createStockItem = async (item: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO stock_items (name, sku, unit, critical_qty, on_hand_qty, avg_cost, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [item.name, item.sku, item.unit, item.critical_qty, item.on_hand_qty, item.avg_cost, now, now]
  );
  return result.lastInsertRowId;
};

export const updateStockItem = async (id: number, item: Partial<StockItem>): Promise<void> => {
  const now = new Date().toISOString();
  const fields = Object.keys(item).filter(k => k !== 'id' && k !== 'created_at').map(k => `${k} = ?`);
  const values = Object.entries(item).filter(([k]) => k !== 'id' && k !== 'created_at').map(([_, v]) => v);
  values.push(now, id);
  
  await db.runAsync(
    `UPDATE stock_items SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
    values
  );
};

export const deleteStockItem = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM stock_items WHERE id = ?', [id]);
};

// Weighted Average Costing
export const recordStockIn = async (
  itemId: number,
  qty: number,
  unitPrice: number,
  supplier: string,
  moveDate: string
): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const item = await getStockItem(itemId);
    if (!item) throw new Error('Item not found');
    
    // Calculate new weighted average
    const currentValue = item.on_hand_qty * item.avg_cost;
    const newValue = qty * unitPrice;
    const newQty = item.on_hand_qty + qty;
    const newAvg = newQty > 0 ? (currentValue + newValue) / newQty : 0;
    
    // Update stock item
    await updateStockItem(itemId, {
      on_hand_qty: newQty,
      avg_cost: parseFloat(newAvg.toFixed(4))
    });
    
    // Record move
    await db.runAsync(
      'INSERT INTO stock_moves (item_id, move_type, qty, unit_price, supplier, move_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [itemId, 'IN', qty, unitPrice, supplier, moveDate, new Date().toISOString()]
    );
  });
};

export const recordStockOut = async (
  itemId: number,
  qty: number,
  moveDate: string,
  note?: string
): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const item = await getStockItem(itemId);
    if (!item) throw new Error('Item not found');
    if (item.on_hand_qty < qty) throw new Error('Insufficient stock');
    
    const newQty = item.on_hand_qty - qty;
    
    // Update stock item
    await updateStockItem(itemId, {
      on_hand_qty: newQty
    });
    
    // Record move
    await db.runAsync(
      'INSERT INTO stock_moves (item_id, move_type, qty, unit_price, supplier, move_date, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [itemId, 'OUT', qty, item.avg_cost, '', moveDate, note || '', new Date().toISOString()]
    );
    
    // Check critical stock
    if (newQty < item.critical_qty) {
      await createNotification({
        type: 'critical_stock',
        title: 'Kritik Stok Uyarısı',
        message: `${item.name} stok seviyesi kritik seviyenin altına düştü (${newQty} ${item.unit})`
      });
    }
  });
};

// Templates
export const getAllTemplates = async (): Promise<Template[]> => {
  return await db.getAllAsync('SELECT * FROM templates ORDER BY name ASC');
};

export const getTemplate = async (id: number): Promise<Template | null> => {
  return await db.getFirstAsync('SELECT * FROM templates WHERE id = ?', [id]);
};

export const getTemplateItems = async (templateId: number): Promise<(TemplateItem & StockItem)[]> => {
  return await db.getAllAsync(
    `SELECT ti.*, si.name, si.unit, si.avg_cost, si.on_hand_qty 
     FROM template_items ti 
     JOIN stock_items si ON ti.item_id = si.id 
     WHERE ti.template_id = ?`,
    [templateId]
  );
};

export const createTemplate = async (name: string, items: { item_id: number; qty: number }[]): Promise<number> => {
  let templateId: number = 0;
  
  await db.withTransactionAsync(async () => {
    const now = new Date().toISOString();
    const result = await db.runAsync(
      'INSERT INTO templates (name, created_at, updated_at) VALUES (?, ?, ?)',
      [name, now, now]
    );
    templateId = result.lastInsertRowId;
    
    for (const item of items) {
      await db.runAsync(
        'INSERT INTO template_items (template_id, item_id, qty) VALUES (?, ?, ?)',
        [templateId, item.item_id, item.qty]
      );
    }
  });
  
  return templateId;
};

export const updateTemplate = async (id: number, name: string, items: { item_id: number; qty: number }[]): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const now = new Date().toISOString();
    await db.runAsync('UPDATE templates SET name = ?, updated_at = ? WHERE id = ?', [name, now, id]);
    await db.runAsync('DELETE FROM template_items WHERE template_id = ?', [id]);
    
    for (const item of items) {
      await db.runAsync(
        'INSERT INTO template_items (template_id, item_id, qty) VALUES (?, ?, ?)',
        [id, item.item_id, item.qty]
      );
    }
  });
};

export const deleteTemplate = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM templates WHERE id = ?', [id]);
};

// Customers
export const getAllCustomers = async (): Promise<Customer[]> => {
  return await db.getAllAsync('SELECT * FROM customers ORDER BY name ASC');
};

export const getCustomer = async (id: number): Promise<Customer | null> => {
  return await db.getFirstAsync('SELECT * FROM customers WHERE id = ?', [id]);
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO customers (name, email, phone, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [customer.name, customer.email, customer.phone, customer.address, now, now]
  );
  return result.lastInsertRowId;
};

export const updateCustomer = async (id: number, customer: Partial<Customer>): Promise<void> => {
  const now = new Date().toISOString();
  const fields = Object.keys(customer).filter(k => k !== 'id' && k !== 'created_at').map(k => `${k} = ?`);
  const values = Object.entries(customer).filter(([k]) => k !== 'id' && k !== 'created_at').map(([_, v]) => v);
  values.push(now, id);
  
  await db.runAsync(
    `UPDATE customers SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
    values
  );
};

export const deleteCustomer = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
};

// Orders
export const getAllOrders = async (): Promise<any[]> => {
  return await db.getAllAsync(
    `SELECT o.*, c.name as customer_name, t.name as template_name 
     FROM orders o 
     JOIN customers c ON o.customer_id = c.id 
     JOIN templates t ON o.template_id = t.id 
     ORDER BY o.created_at DESC`
  );
};

export const getOrder = async (id: number): Promise<any | null> => {
  return await db.getFirstAsync(
    `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address, t.name as template_name 
     FROM orders o 
     JOIN customers c ON o.customer_id = c.id 
     JOIN templates t ON o.template_id = t.id 
     WHERE o.id = ?`,
    [id]
  );
};

export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO orders (customer_id, template_id, status, sale_price, shipper, tracking_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [order.customer_id, order.template_id, order.status, order.sale_price, order.shipper || '', order.tracking_code || '', now, now]
  );
  return result.lastInsertRowId;
};

export const updateOrder = async (id: number, order: Partial<Order>): Promise<void> => {
  const now = new Date().toISOString();
  const fields = Object.keys(order).filter(k => k !== 'id' && k !== 'created_at').map(k => `${k} = ?`);
  const values = Object.entries(order).filter(([k]) => k !== 'id' && k !== 'created_at').map(([_, v]) => v);
  values.push(now, id);
  
  await db.runAsync(
    `UPDATE orders SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
    values
  );
};

// Notifications
export const getAllNotifications = async (): Promise<Notification[]> => {
  return await db.getAllAsync('SELECT * FROM notifications ORDER BY created_at DESC');
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM notifications WHERE read_at IS NULL');
  return result?.count || 0;
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read_at'>): Promise<number> => {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO notifications (type, title, message, created_at) VALUES (?, ?, ?, ?)',
    [notification.type, notification.title, notification.message, now]
  );
  return result.lastInsertRowId;
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  const now = new Date().toISOString();
  await db.runAsync('UPDATE notifications SET read_at = ? WHERE id = ?', [now, id]);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const now = new Date().toISOString();
  await db.runAsync('UPDATE notifications SET read_at = ? WHERE read_at IS NULL', [now]);
};

// Backup & Restore
export const exportDatabase = async (): Promise<any> => {
  const stockItems = await getAllStockItems();
  const stockMoves = await db.getAllAsync('SELECT * FROM stock_moves');
  const templates = await getAllTemplates();
  const templateItems = await db.getAllAsync('SELECT * FROM template_items');
  const customers = await getAllCustomers();
  const orders = await db.getAllAsync('SELECT * FROM orders');
  const notifications = await getAllNotifications();
  
  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    data: {
      stock_items: stockItems,
      stock_moves: stockMoves,
      templates: templates,
      template_items: templateItems,
      customers: customers,
      orders: orders,
      notifications: notifications
    }
  };
};

export const importDatabase = async (data: any): Promise<void> => {
  await db.withTransactionAsync(async () => {
    // Import stock items
    if (data.data.stock_items) {
      for (const item of data.data.stock_items) {
        const existing = await getStockItem(item.id);
        if (existing) {
          await updateStockItem(item.id, item);
        } else {
          await db.runAsync(
            'INSERT INTO stock_items (id, name, sku, unit, critical_qty, on_hand_qty, avg_cost, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [item.id, item.name, item.sku, item.unit, item.critical_qty, item.on_hand_qty, item.avg_cost, item.created_at, item.updated_at]
          );
        }
      }
    }
    
    // Import customers
    if (data.data.customers) {
      for (const customer of data.data.customers) {
        const existing = await getCustomer(customer.id);
        if (existing) {
          await updateCustomer(customer.id, customer);
        } else {
          await db.runAsync(
            'INSERT INTO customers (id, name, email, phone, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [customer.id, customer.name, customer.email, customer.phone, customer.address, customer.created_at, customer.updated_at]
          );
        }
      }
    }
    
    // Import templates
    if (data.data.templates) {
      for (const template of data.data.templates) {
        const existing = await getTemplate(template.id);
        if (existing) {
          await db.runAsync('UPDATE templates SET name = ?, updated_at = ? WHERE id = ?', [template.name, template.updated_at, template.id]);
        } else {
          await db.runAsync(
            'INSERT INTO templates (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [template.id, template.name, template.created_at, template.updated_at]
          );
        }
      }
    }
    
    // Import template items
    if (data.data.template_items) {
      await db.runAsync('DELETE FROM template_items');
      for (const item of data.data.template_items) {
        await db.runAsync(
          'INSERT INTO template_items (id, template_id, item_id, qty) VALUES (?, ?, ?, ?)',
          [item.id, item.template_id, item.item_id, item.qty]
        );
      }
    }
  });
};
