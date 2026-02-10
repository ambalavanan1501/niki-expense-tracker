
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO string
  type: TransactionType;
  originalAmount?: number;
  originalCurrency?: 'INR' | 'USD';
  exchangeRate?: number;
  isRecurring?: boolean;
  recurringId?: string;
}

export interface ExpenseSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export interface Budget {
  category: string;
  limit: number;
}

export type FilterRange = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface FilterState {
  range: FilterRange;
  category: string;
  search: string;
}