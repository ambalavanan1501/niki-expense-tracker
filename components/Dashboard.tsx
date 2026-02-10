import React, { useMemo, useState } from 'react';
import { Transaction, Budget } from '../types';
import { Card } from './Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Target, Plus } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useBudgets } from '../hooks/useBudgets';
import { BudgetForm } from './BudgetForm';
import { Modal } from './Modal';

interface Props {
  transactions: Transaction[];
}

export const Dashboard: React.FC<Props> = ({ transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  const { budgets, updateBudget } = useBudgets();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

  const stats = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        const tDate = new Date(t.date);
        const isCurrentMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;

        // Total Balance (All time)
        if (t.type === 'income') acc.balance += t.amount;
        else acc.balance -= t.amount;

        // Monthly Stats
        if (isCurrentMonth) {
          if (t.type === 'income') acc.income += t.amount;
          else acc.expense += t.amount;
        }
        return acc;
      },
      { balance: 0, income: 0, expense: 0 }
    );
  }, [transactions, currentMonth, currentYear]);

  // Calculate spending per category for current month for Budget View
  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (t.type === 'expense' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      }
    });
    return spending;
  }, [transactions, currentMonth, currentYear]);

  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryMap: Record<string, number> = {};
    
    expenses.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    return Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key]
    })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 categories
  }, [transactions]);

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsBudgetModalOpen(true);
  };

  const handleNewBudget = () => {
    setEditingBudget(undefined);
    setIsBudgetModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Balance */}
        <Card className="p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-500/30 transition-all"></div>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Balance</p>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white">₹{stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Wallet size={24} />
                </div>
            </div>
        </Card>

        {/* Income */}
        <Card className="p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Monthly Income</p>
                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">+₹{stats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={24} />
                </div>
            </div>
        </Card>

        {/* Expenses */}
        <Card className="p-6 relative overflow-hidden">
             <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Monthly Expenses</p>
                    <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">-₹{stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
                    <TrendingDown size={24} />
                </div>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <Card className="p-6 h-[350px]">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Expense Breakdown</h4>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                          border: 'none', 
                          borderRadius: '12px', 
                          color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}
                        formatter={(value: number) => `₹${value.toFixed(2)}`}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                    No expense data available
                </div>
            )}
        </Card>
        
        {/* Budgets Section */}
        <Card className="p-6 flex flex-col">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                   <Target size={20} />
                 </div>
                 <h4 className="text-lg font-semibold text-slate-800 dark:text-white">Monthly Budgets</h4>
              </div>
              <button 
                onClick={handleNewBudget}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1"
              >
                <Plus size={14} /> Set Budget
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {budgets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-8">
                  <p className="text-sm">No budgets set yet.</p>
                  <p className="text-xs mt-1">Set limits to track your spending.</p>
                </div>
              ) : (
                budgets.map(budget => {
                  const spent = categorySpending[budget.category] || 0;
                  const percentage = Math.min((spent / budget.limit) * 100, 100);
                  let barColor = 'bg-emerald-500';
                  if (percentage > 90) barColor = 'bg-red-500';
                  else if (percentage > 75) barColor = 'bg-amber-500';
                  
                  return (
                    <div 
                      key={budget.category} 
                      onClick={() => handleEditBudget(budget)}
                      className="cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{budget.category}</span>
                        <span className="text-slate-500 text-xs">
                          <span className={percentage > 100 ? 'text-red-500 font-bold' : ''}>₹{spent.toLocaleString()}</span> 
                          {' '}/ ₹{budget.limit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${barColor} transition-all duration-1000`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
           </div>
        </Card>
      </div>

      <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)}>
        <BudgetForm 
          currentBudget={editingBudget}
          onSave={updateBudget}
          onClose={() => setIsBudgetModalOpen(false)}
        />
      </Modal>
    </div>
  );
};