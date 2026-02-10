import React, { useState } from 'react';
import { EXPENSE_CATEGORIES } from '../constants';
import { Button } from './Button';
import { X } from 'lucide-react';
import { Budget } from '../types';

interface Props {
  currentBudget?: Budget;
  onSave: (category: string, limit: number) => void;
  onClose: () => void;
}

export const BudgetForm: React.FC<Props> = ({ currentBudget, onSave, onClose }) => {
  const [category, setCategory] = useState(currentBudget?.category || EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState(currentBudget?.limit?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(category, parseFloat(limit));
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {currentBudget ? 'Edit Budget' : 'Set Monthly Budget'}
        </h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={!!currentBudget}
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
        >
          {EXPENSE_CATEGORIES.map(cat => (
            <option key={cat} value={cat} className="bg-white dark:bg-slate-900">{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Monthly Limit (₹)</label>
        <input
          type="number"
          required
          min="1"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          placeholder="e.g. 5000"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" fullWidth>Save Budget</Button>
      </div>
    </form>
  );
};