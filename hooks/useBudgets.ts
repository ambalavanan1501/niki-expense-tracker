import { useState, useEffect, useCallback } from 'react';
import { Budget } from '../types';
import { dbOperations } from '../lib/db';

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dbOperations.getAllBudgets();
        setBudgets(data);
      } catch (e) {
        console.error("Failed to load budgets from DB", e);
      }
    };
    loadData();
  }, []);

  const updateBudget = useCallback(async (category: string, limit: number) => {
    // Optimistic update
    setBudgets(prev => {
      const existingIndex = prev.findIndex(b => b.category === category);
      let updated: Budget[];
      
      if (limit <= 0) {
        // Remove if limit is 0 or negative
        updated = prev.filter(b => b.category !== category);
      } else if (existingIndex >= 0) {
        // Update existing
        updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], limit };
      } else {
        // Add new
        updated = [...prev, { category, limit }];
      }
      return updated;
    });

    // DB update
    try {
      if (limit <= 0) {
        await dbOperations.deleteBudget(category);
      } else {
        await dbOperations.updateBudget({ category, limit });
      }
    } catch (e) {
      console.error("Failed to save budget", e);
    }
  }, []);

  const removeBudget = useCallback(async (category: string) => {
    setBudgets(prev => prev.filter(b => b.category !== category));
    try {
      await dbOperations.deleteBudget(category);
    } catch (e) {
      console.error("Failed to remove budget", e);
    }
  }, []);

  return { budgets, updateBudget, removeBudget };
};
