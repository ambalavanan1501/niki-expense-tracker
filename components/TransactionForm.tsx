import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { Button } from './Button';
import { X, ArrowRightLeft } from 'lucide-react';

interface Props {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

const EXCHANGE_RATE = 84.0; // Fixed rate for demo: 1 USD = 84 INR

export const TransactionForm: React.FC<Props> = ({ onSubmit, onClose }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    let finalAmount = parseFloat(amount);
    
    // Store original details if currency is USD
    const originalAmount = currency === 'USD' ? parseFloat(amount) : undefined;
    const originalCurrency = currency === 'USD' ? 'USD' : 'INR';
    const rate = currency === 'USD' ? EXCHANGE_RATE : undefined;

    if (currency === 'USD') {
      finalAmount = finalAmount * EXCHANGE_RATE;
    }

    onSubmit({
      amount: finalAmount,
      description,
      category,
      date,
      type,
      originalAmount,
      originalCurrency,
      exchangeRate: rate
    });
    onClose();
  };

  const convertedAmount = amount ? (parseFloat(amount) * EXCHANGE_RATE).toFixed(2) : '0.00';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">New Transaction</h2>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Type Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => { setType('expense'); setCategory(EXPENSE_CATEGORIES[0]); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            type === 'expense' 
            ? 'bg-white dark:bg-red-500/20 text-red-600 dark:text-red-400 shadow-sm border border-slate-200 dark:border-red-500/30' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategory(INCOME_CATEGORIES[0]); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            type === 'income' 
            ? 'bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-emerald-500/30' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Income
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Amount</label>
            <button
              type="button"
              onClick={() => setCurrency(prev => prev === 'INR' ? 'USD' : 'INR')}
              className="text-xs flex items-center gap-1 text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
            >
              <ArrowRightLeft size={12} />
              Switch to {currency === 'INR' ? 'USD' : 'INR'}
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">
              {currency === 'INR' ? '₹' : '$'}
            </span>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-8 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="0.00"
            />
          </div>
          {currency === 'USD' && amount && (
            <div className="mt-2 text-right text-sm text-slate-400">
              <span className="text-slate-500">Approx: </span>
              <span className="text-emerald-500 dark:text-emerald-400 font-mono">₹{convertedAmount}</span>
              <span className="text-xs text-slate-500 ml-1">(@ ₹{EXCHANGE_RATE}/$)</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
          >
            {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
              <option key={cat} value={cat} className="bg-white dark:bg-slate-900">{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:[color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="What was it for?"
          />
        </div>
      </div>

      <Button type="submit" fullWidth size="lg" className="mt-8">
        Save Transaction
      </Button>
    </form>
  );
};