import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Card } from './Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

export const CalendarView: React.FC<Props> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const dailySpending = useMemo(() => {
    const spending: Record<number, number> = {};
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (
        t.type === 'expense' &&
        tDate.getMonth() === currentDate.getMonth() &&
        tDate.getFullYear() === currentDate.getFullYear()
      ) {
        const day = tDate.getDate();
        spending[day] = (spending[day] || 0) + t.amount;
      }
    });
    return spending;
  }, [transactions, currentDate]);

  const renderCalendarDays = () => {
    const days = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 sm:h-24 bg-transparent"></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const amount = dailySpending[day];
      const isToday = 
        new Date().getDate() === day && 
        new Date().getMonth() === currentDate.getMonth() && 
        new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <div 
          key={day} 
          className={`
            relative border border-slate-200 dark:border-white/5 p-1 flex flex-col items-start justify-between h-20 sm:h-24 transition-colors
            ${isToday ? 'bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/30' : 'bg-white dark:bg-slate-800/40'}
          `}
        >
          <span className={`text-[10px] sm:text-xs font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            {day}
          </span>
          {amount > 0 && (
            <div className="self-end mt-auto w-full animate-fade-in">
               <div className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-white text-right truncate">
                 ₹{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
               </div>
               <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                 <div className="h-full bg-red-500/70" style={{ width: '100%' }}></div>
               </div>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-slate-100 dark:bg-slate-800 p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">
        {renderCalendarDays()}
      </div>
    </Card>
  );
};