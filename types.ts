export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO string
  type: TransactionType;
}

export interface ExpenseSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export type FilterRange = 'all' | 'today' | 'week' | 'month';

export interface FilterState {
  range: FilterRange;
  category: string;
  search: string;
}
