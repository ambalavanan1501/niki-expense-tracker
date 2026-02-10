import React, { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { usePWA } from './hooks/usePWA';
import { useTheme } from './hooks/useTheme';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { Modal } from './components/Modal';
import { Plus, Download, Trash2, WifiOff, FileText, Moon, Sun, Smartphone } from 'lucide-react';
import { vibrate } from './utils/haptics';

function App() {
  const { transactions, addTransaction, removeTransaction, clearAllData, exportPDF, exportCSV } = useTransactions();
  const { isOffline, showInstallPrompt, installApp } = usePWA();
  const { theme, toggleTheme } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');

  const handleFabClick = () => {
    vibrate(15);
    setIsFormOpen(true);
  };

  const handleThemeToggle = () => {
    vibrate(10);
    toggleTheme();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 selection:bg-indigo-500/30 safe-area-top safe-area-bottom transition-colors duration-300">
      {/* Offline Toast */}
      {isOffline && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in-down safe-area-top pt-2">
          <div className="bg-amber-500/90 backdrop-blur text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff size={16} />
            You are offline. Changes will be saved locally.
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
              <span className="font-bold text-xl">N</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
              Niki
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={handleThemeToggle}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

            {/* Install PWA Button */}
            {showInstallPrompt && (
              <button 
                onClick={() => { vibrate(10); installApp(); }}
                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors animate-pulse"
                title="Install App"
              >
                <Smartphone size={20} />
              </button>
            )}
            
            <button 
              onClick={exportCSV}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg transition-colors"
              title="Export CSV"
            >
              <FileText size={20} />
            </button>
            <button 
              onClick={exportPDF}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg transition-colors"
              title="Export PDF"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={clearAllData}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Clear Data"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-200 dark:bg-slate-900/50 rounded-xl mb-6 border border-slate-300 dark:border-white/5">
          <button
            onClick={() => { setActiveTab('dashboard'); vibrate(10); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('transactions'); vibrate(10); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'transactions' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Transactions
          </button>
        </div>

        {/* Views */}
        <div className="min-h-[60vh]">
          {activeTab === 'dashboard' ? (
            <Dashboard transactions={transactions} />
          ) : (
            <TransactionList transactions={transactions} onDelete={removeTransaction} />
          )}
        </div>
      </main>

      {/* FAB - Quick Add */}
      <div className="fixed bottom-8 right-6 z-40">
        <button
          onClick={handleFabClick}
          className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all border border-indigo-400/30"
          aria-label="Add Transaction"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <TransactionForm 
          onSubmit={addTransaction} 
          onClose={() => setIsFormOpen(false)} 
        />
      </Modal>

    </div>
  );
}

export default App;