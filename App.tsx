import React, { useState, useRef } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { usePWA } from './hooks/usePWA';
import { useTheme } from './hooks/useTheme';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { CalendarView } from './components/CalendarView';
import { Modal } from './components/Modal';
import { Plus, Download, Trash2, WifiOff, FileText, Moon, Sun, Smartphone, LayoutDashboard, List, Calendar as CalendarIcon, FileJson, Upload } from 'lucide-react';
import { vibrate } from './utils/haptics';
import { dbOperations } from './lib/db';

function App() {
  const { transactions, addTransaction, removeTransaction, clearAllData, exportPDF, exportCSV } = useTransactions();
  const { isOffline, showInstallPrompt, installApp } = usePWA();
  const { theme, toggleTheme } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'calendar'>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFabClick = () => {
    vibrate(15);
    setIsFormOpen(true);
  };

  const handleThemeToggle = () => {
    vibrate(10);
    toggleTheme();
  };

  const handleExportJSON = async () => {
    try {
        const data = await dbOperations.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `niki_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Export failed', error);
        alert('Failed to export data');
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('Restoring data will overwrite all current transactions and budgets. Are you sure?')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Basic validation
                if (!json.transactions && !json.budgets) {
                    throw new Error('Invalid backup file format');
                }
                
                await dbOperations.importData(json);
                alert('Data restored successfully! The app will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Import failed', error);
                alert('Failed to import data. Please ensure the file is a valid Niki backup.');
            }
        };
        reader.readAsText(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
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

      {/* Hidden File Input for Restore */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportJSON} 
        className="hidden" 
        accept=".json"
      />

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
            
            {/* Data Management Buttons */}
            <button 
              onClick={handleExportJSON}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg transition-colors"
              title="Backup Data (JSON)"
            >
              <FileJson size={20} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg transition-colors"
              title="Restore Data (JSON)"
            >
              <Upload size={20} />
            </button>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

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
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'dashboard' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => { setActiveTab('transactions'); vibrate(10); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'transactions' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List size={16} />
            <span className="hidden sm:inline">Transactions</span>
          </button>
          <button
            onClick={() => { setActiveTab('calendar'); vibrate(10); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'calendar' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon size={16} />
            <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>

        {/* Views */}
        <div className="min-h-[60vh] animate-fade-in">
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} />}
          {activeTab === 'transactions' && <TransactionList transactions={transactions} onDelete={removeTransaction} />}
          {activeTab === 'calendar' && <CalendarView transactions={transactions} />}
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