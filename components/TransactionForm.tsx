import React, { useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { Button } from './Button';
import { X, ArrowRightLeft, Camera, RefreshCw, Loader2, ScanLine } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface Props {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

const EXCHANGE_RATE = 84.0; // Fixed rate for demo: 1 USD = 84 INR

// Helper: Convert various date strings to YYYY-MM-DD
const normalizeDate = (dateStr: string): string | null => {
  try {
    // Try native parsing first
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    // Handle DD/MM/YYYY or DD-MM-YYYY manually if native fails
    const parts = dateStr.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (parts) {
      return `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
  } catch (e) {
    return null;
  }
  return null;
};

// Helper: Image Pre-processing for better OCR
const preprocessImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context unavailable');

        // Scale down large images for performance
        const MAX_WIDTH = 1800;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Apply Grayscale & Contrast
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Grayscale (Luminosity method)
          let gray = 0.21 * r + 0.72 * g + 0.07 * b;
          
          // Increase Contrast
          const contrast = 1.2; // 1.0 is normal, >1.0 is higher
          gray = contrast * (gray - 128) + 128;
          
          // Clamp
          if (gray < 0) gray = 0;
          if (gray > 255) gray = 255;

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

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
  const [scanStatus, setScanStatus] = useState('');
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
    setScanStatus('Optimizing image...');

    try {
      // 1. Pre-process Image
      const processedImage = await preprocessImage(file);
      
      setScanStatus('Reading text...');
      
      // 2. Recognize Text
      const result = await Tesseract.recognize(processedImage, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setScanStatus(`Scanning... ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      const text = result.data.text;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      console.log('--- OCR Result ---');
      console.log(text);
      console.log('------------------');

      // 3. Smart Extraction
      
      // A. Extract Amount
      // Priority: Look for "Total", "Amount Due", "Balance"
      // Fallback: Largest number with decimals
      const currencySymbols = /[₹$€£]/g;
      const amountRegex = /(\d{1,3}(?:[,.]\d{3})*(?:[.,]\d{2}))/g;
      
      let foundAmount = 0;
      let foundHighConfAmount = false;

      // Scan lines for Total keywords
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('total') || lowerLine.includes('amount') || lowerLine.includes('due') || lowerLine.includes('pay')) {
           const matches = line.match(amountRegex);
           if (matches) {
             // Take the last number in the "Total" line usually
             const valStr = matches[matches.length - 1].replace(/,/g, '.').replace(/[^\d.]/g, '');
             // Fix common OCR error: 100.00 becoming 100..00
             const cleanVal = parseFloat(valStr.split('.').slice(0, 2).join('.'));
             
             if (!isNaN(cleanVal) && cleanVal > foundAmount) {
                foundAmount = cleanVal;
                foundHighConfAmount = true;
             }
           }
        }
      }

      // If no keyword found, find max number
      if (!foundHighConfAmount) {
         const allNumbers = text.match(amountRegex);
         if (allNumbers) {
            const values = allNumbers.map(n => {
                const clean = parseFloat(n.replace(/,/g, '.').replace(/[^\d.]/g, ''));
                return isNaN(clean) ? 0 : clean;
            });
            foundAmount = Math.max(...values);
         }
      }

      if (foundAmount > 0) setAmount(foundAmount.toFixed(2));

      // B. Extract Date
      // Matches DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
      const dateRegex = /\b(\d{1,2}[-./]\d{1,2}[-./]\d{2,4})\b|\b(\d{4}[-./]\d{1,2}[-./]\d{1,2})\b/;
      const dateMatch = text.match(dateRegex);
      if (dateMatch) {
         const normalized = normalizeDate(dateMatch[0]);
         if (normalized) setDate(normalized);
      }

      // C. Extract Merchant / Category
      // Simple heuristic: First non-date, non-number line is often the Merchant
      let potentialMerchant = '';
      for (const line of lines) {
         if (line.length > 3 && !line.match(/\d/) && !line.toLowerCase().includes('receipt')) {
            potentialMerchant = line.substring(0, 25); // Limit length
            // Title Case
            potentialMerchant = potentialMerchant.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
         }
      }

      if (potentialMerchant) setDescription(potentialMerchant);

      // Category Guessing
      const lowerText = text.toLowerCase();
      if (lowerText.includes('restaurant') || lowerText.includes('food') || lowerText.includes('burger') || lowerText.includes('pizza')) {
        setCategory('Food');
      } else if (lowerText.includes('uber') || lowerText.includes('fuel') || lowerText.includes('petrol') || lowerText.includes('parking')) {
        setCategory('Transport');
      } else if (lowerText.includes('market') || lowerText.includes('grocery') || lowerText.includes('store')) {
        setCategory('Shopping');
      } else if (lowerText.includes('dr.') || lowerText.includes('pharmacy') || lowerText.includes('hospital')) {
        setCategory('Healthcare');
      }

    } catch (err) {
      console.error('OCR Error:', err);
      alert('Failed to read receipt. Please try a clearer image.');
    } finally {
      setIsScanning(false);
      setScanStatus('');
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
            <div className="flex gap-2">
                <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className={`
                    text-xs flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all
                    ${isScanning 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }
                `}
                >
                {isScanning ? <Loader2 size={12} className="animate-spin"/> : <ScanLine size={12} />}
                {isScanning ? scanStatus || 'Scanning...' : 'Scan Receipt'}
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
                className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors px-2 py-1"
                >
                <ArrowRightLeft size={12} />
                {currency}
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