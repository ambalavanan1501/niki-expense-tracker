import { openDB, DBSchema } from 'idb';
import { Transaction, Budget } from '../types';

interface NikiDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
  };
  budgets: {
    key: string;
    value: Budget;
  };
}

const DB_NAME = 'niki-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<NikiDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: 'category' });
      }
    },
  });
};

export const dbOperations = {
  async getAllTransactions() {
    const db = await initDB();
    return db.getAll('transactions');
  },
  
  async addTransaction(transaction: Transaction) {
    const db = await initDB();
    return db.put('transactions', transaction);
  },
  
  async deleteTransaction(id: string) {
    const db = await initDB();
    return db.delete('transactions', id);
  },

  async clearTransactions() {
    const db = await initDB();
    return db.clear('transactions');
  },

  async getAllBudgets() {
    const db = await initDB();
    return db.getAll('budgets');
  },

  async updateBudget(budget: Budget) {
    const db = await initDB();
    return db.put('budgets', budget);
  },

  async deleteBudget(category: string) {
    const db = await initDB();
    return db.delete('budgets', category);
  },

  async clearBudgets() {
    const db = await initDB();
    return db.clear('budgets');
  },

  async exportData() {
    const db = await initDB();
    const transactions = await db.getAll('transactions');
    const budgets = await db.getAll('budgets');
    return { 
        meta: {
            version: '1.0',
            date: new Date().toISOString(),
            app: 'Niki Expense Tracker'
        },
        transactions, 
        budgets 
    };
  },

  async importData(data: { transactions: Transaction[], budgets: Budget[] }) {
     const db = await initDB();
     const tx = db.transaction(['transactions', 'budgets'], 'readwrite');
     
     const tStore = tx.objectStore('transactions');
     const bStore = tx.objectStore('budgets');

     await tStore.clear();
     await bStore.clear();

     if (data.transactions && Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
            await tStore.put(t);
        }
     }

     if (data.budgets && Array.isArray(data.budgets)) {
        for (const b of data.budgets) {
            await bStore.put(b);
        }
     }

     await tx.done;
  }
};