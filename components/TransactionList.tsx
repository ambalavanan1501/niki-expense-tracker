import React, { useState, useMemo } from 'react';
import { Transaction, FilterRange } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';
import { Card } from './Card';
import { 
  Search, Filter, Trash2, ArrowUpRight, ArrowDownLeft,
  Utensils, Car, Home, Zap, Film, HeartPulse, ShoppingBag, 
  Banknote, TrendingUp, Laptop, MoreHorizontal, Calendar
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Food': Utensils,
  'Transport': Car,
  'Housing': Home,
  'Utilities': Zap,
  'Entertainment': Film,
  'Healthcare': HeartPulse,
  'Shopping': ShoppingBag,
  'Salary': Banknote,
  'Investment': TrendingUp,
  'Freelance': Laptop,
  'Other': MoreHorizontal
};

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-yellow-500/30 text-yellow-800 dark:text-yellow-200 rounded px-0.5">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const TransactionList: React.FC<Props> = ({ transactions, onDelete }) => {
  const [range, setRange] = useState<FilterRange>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || t.category === category;
      
      let matchesRange = true;
      const tDate = new Date(t.date);
      const today = new Date();
      
      if (range === 'today') {
        matchesRange = tDate.toDateString() === today.toDateString();
      } else if (range === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        matchesRange = tDate >= weekAgo;
      } else if (range === 'month') {
        matchesRange = tDate.getMonth() === new Date().getMonth() && tDate.getFullYear() === new Date().getFullYear();
      } else if (range === 'custom') {
        if (customStart && customEnd) {
          const start = new Date(customStart);
          const end = new Date(customEnd);
          // Set end date to end of day to be inclusive
          end.setHours(23, 59, 59, 999);
          matchesRange = tDate >= start && tDate <= end;
        } else if (customStart) {
          const start = new Date(customStart);
          matchesRange = tDate >= start;
        } else if (customEnd) {
           const end = new Date(customEnd);
           end.setHours(23, 59, 59, 999);
           matchesRange = tDate <= end;
        }
      }

      return matchesSearch && matchesCategory && matchesRange;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, range, category, search, customStart, customEnd]);

  return (
    <div className="space-y-6 pb-24">
      <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur-md pt-4 pb-2 space-y-3 shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <select
                value={range}
                onChange={(e) => setRange(e.target.value as FilterRange)}
                className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
            </select>

            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
            </div>
            
            {/* Custom Range Inputs */}
            {range === 'custom' && (
                <div className="flex items-center gap-2 animate-fade-in text-sm">
                    <div className="relative flex-1">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="date" 
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-2 text-slate-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            placeholder="Start"
                        />
                    </div>
                    <span className="text-slate-500">-</span>
                    <div className="relative flex-1">
                         <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="date" 
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-2 text-slate-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map(t => {
            const Icon = CATEGORY_ICONS[t.category] || MoreHorizontal;
            return (
              <Card key={t.id} className="p-4 group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-full ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                      {t.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <h4 className="text-slate-800 dark:text-white font-medium">
                        <HighlightText text={t.description} highlight={search} />
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${CATEGORY_COLORS[t.category] || 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30'}`}>
                          <Icon size={14} strokeWidth={2.5} />
                          {t.category}
                        </span>
                        <span>{new Date(t.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {t.originalAmount && t.originalCurrency === 'USD' && (
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                            ${t.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    )}
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="mt-1 text-slate-400 hover:text-red-500 transition-colors p-1.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};