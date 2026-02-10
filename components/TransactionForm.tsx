import React, { useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { Button } from './Button';
import { X, ArrowRightLeft, Camera, RefreshCw, Loader2 } from 'lucide-react';
import Tesseract from 'tesseract.js';

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
  const [isRecurring, setIsRecurring] = useState(false);
  
  // OCR State
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      exchangeRate: rate,
      isRecurring
    });
    onClose();
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m)
      });
      
      const text = result.data.text;
      console.log('Scanned text:', text);

      // Attempt to find total amount using Regex
      // Looks for patterns like "Total 123.45" or just numbers at the end of lines
      const amountRegex = /(?:total|amount|due)[\D]*?(\d+[.,]\d{2})/i;
      const match = text.match(amountRegex);
      
      if (match && match[1]) {
        // Clean up the amount (replace comma with dot if needed for float parsing)
        const foundAmount = match[1].replace(',', '.');
        setAmount(foundAmount);
        
        // Try to guess category or description (very basic)
        if (text.toLowerCase().includes('restaurant') || text.toLowerCase().includes('food')) {
            setCategory('Food');
        } else if (text.toLowerCase().includes('uber') || text.toLowerCase().includes('fuel')) {
            setCategory('Transport');
        }
      } else {
        // Fallback: Find the largest number that looks like a price
        const allNumbers = text.match(/\d+[.,]\d{2}/g);
        if (allNumbers) {
            const maxVal = Math.max(...allNumbers.map(n => parseFloat(n.replace(',', '.'))));
            if (isFinite(maxVal)) setAmount(maxVal.toString());
        } else {
            alert('Could not detect an amount. Please enter manually.');
        }
      }
    } catch (err) {
      console.error('OCR Error:', err);
      alert('Failed to scan receipt.');
    } finally {
      setIsScanning(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
            <div className="flex gap-3">
                <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="text-xs flex items-center gap-1 text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
                >
                {isScanning ? <Loader2 size={12} className="animate-spin"/> : <Camera size={12} />}
                {isScanning ? 'Scanning...' : 'Scan Receipt'}
                </button>
                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleScanReceipt} 
                    className="hidden" 
                />
                <button
                type="button"
                onClick={() => setCurrency(prev => prev === 'INR' ? 'USD' : 'INR')}
                className="text-xs flex items-center gap-1 text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                >
                <ArrowRightLeft size={12} />
                Switch to {currency === 'INR' ? 'USD' : 'INR'}
                </button>
            </div>
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

        {/* Recurring Toggle */}
        <div className="flex items-center gap-3 pt-2">
            <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`
                    relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                    ${isRecurring ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}
                `}
            >
                <span
                    className={`
                        inline-block w-4 h-4 transform bg-white rounded-full transition duration-200 ease-in-out mt-1 ml-1
                        ${isRecurring ? 'translate-x-5' : 'translate-x-0'}
                    `}
                />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                <RefreshCw size={16} className={isRecurring ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                <span className={`text-sm font-medium ${isRecurring ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                    Repeat Monthly
                </span>
            </div>
        </div>
      </div>

      <Button type="submit" fullWidth size="lg" className="mt-8">
        Save Transaction
      </Button>
    </form>
  );
};