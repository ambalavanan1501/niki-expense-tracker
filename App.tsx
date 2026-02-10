import React, { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { usePWA } from './hooks/usePWA';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { Modal } from './components/Modal';
import { Plus, Download, Trash2, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './components/Button';

function App() {
  const { transactions, addTransaction, removeTransaction, clearAllData, exportData } = useTransactions();
  const { isOffline, showInstallPrompt, installApp } = usePWA();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
      {/* Offline Toast */}
      {isOffline && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in-down">
          <div className="bg-amber-500/90 backdrop-blur text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff size={16} />
            You are offline. Changes will be saved locally.
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed top-20 left-4 right-4 z-40">
           <div className="bg-indigo-600/90 backdrop-blur text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
              <div className="text-sm">Install App for better experience</div>
              <button onClick={installApp} className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold">Install</button>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-xl text-white">L</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Lumina
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportData}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Export JSON"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={clearAllData}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
        <div className="flex p-1 bg-slate-900/50 rounded-xl mb-6 border border-white/5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-slate-700 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'transactions' 
                ? 'bg-slate-700 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
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
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all border border-indigo-400/30"
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
