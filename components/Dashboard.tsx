import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Card } from './Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

export const Dashboard: React.FC<Props> = ({ transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Balance */}
        <Card className="p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all"></div>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Total Balance</p>
                    <h3 className="text-3xl font-bold text-white">${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                    <Wallet size={24} />
                </div>
            </div>
        </Card>

        {/* Income */}
        <Card className="p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Monthly Income</p>
                    <h3 className="text-3xl font-bold text-emerald-400">+${stats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <TrendingUp size={24} />
                </div>
            </div>
        </Card>

        {/* Expenses */}
        <Card className="p-6 relative overflow-hidden">
             <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Monthly Expenses</p>
                    <h3 className="text-3xl font-bold text-red-400">-${stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                    <TrendingDown size={24} />
                </div>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 h-[350px]">
            <h4 className="text-lg font-semibold text-white mb-4">Expense Breakdown</h4>
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
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9' }}
                        itemStyle={{ color: '#f1f5f9' }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
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
        
        {/* Placeholder for future or simple list preview */}
        <Card className="p-6 flex flex-col justify-center items-center text-center space-y-4">
             <h4 className="text-lg font-semibold text-white">Financial Health</h4>
             <p className="text-slate-400 text-sm max-w-xs">
                Your total balance is {stats.balance >= 0 ? 'positive' : 'negative'}. 
                {stats.income > stats.expense ? " You're saving money this month!" : " Watch your spending this month."}
             </p>
             <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden">
                <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${stats.income === 0 ? 0 : Math.min((stats.expense / stats.income) * 100, 100)}%` }}
                ></div>
             </div>
             <p className="text-xs text-slate-500">Expenses vs Income</p>
        </Card>
      </div>
    </div>
  );
};
