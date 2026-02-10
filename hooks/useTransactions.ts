import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dbOperations } from '../lib/db';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from IDB on mount
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await dbOperations.getAllTransactions();
        // Sort by date descending
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(data);
      } catch (e) {
        console.error("Failed to load transactions from DB", e);
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, []);

  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      recurringId: transactionData.isRecurring ? crypto.randomUUID() : undefined
    };

    // Optimistic UI update
    setTransactions(prev => {
      const updated = [newTransaction, ...prev];
      updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return updated;
    });

    // Async DB update
    try {
      await dbOperations.addTransaction(newTransaction);
    } catch (e) {
      console.error("Failed to save transaction", e);
      // Revert on failure could be implemented here
    }
  }, []);

  const removeTransaction = useCallback(async (id: string) => {
    // Optimistic UI update
    setTransactions(prev => prev.filter(t => t.id !== id));

    try {
      await dbOperations.deleteTransaction(id);
    } catch (e) {
      console.error("Failed to delete transaction", e);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      setTransactions([]);
      try {
        await dbOperations.clearTransactions();
      } catch (e) {
        console.error("Failed to clear DB", e);
      }
    }
  }, []);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("Niki Expense Report", 14, 22);
    
    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Filter data for table
    const tableData = transactions.map(t => {
      let originalInfo = '-';
      if (t.originalCurrency === 'USD' && t.originalAmount) {
        originalInfo = `$${t.originalAmount.toFixed(2)} (@ ${t.exchangeRate})`;
      }

      return [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.category,
        t.type.toUpperCase(),
        `Rs. ${t.amount.toFixed(2)}`,
        originalInfo
      ];
    });

    autoTable(doc, {
      head: [['Date', 'Description', 'Category', 'Type', 'Amount (INR)', 'Original']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
      },
      headStyles: { 
        fillColor: [79, 70, 229], // Indigo 600
        textColor: 255 
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Slate 50
      },
      columnStyles: {
        5: { fontStyle: 'italic', textColor: 100 }
      }
    });

    doc.save(`niki_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [transactions]);

  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Date', 'Description', 'Category', 'Type', 'Amount (INR)', 'Original Amount', 'Currency', 'Exchange Rate'];
    
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => {
        const row = [
          t.id,
          t.date,
          `"${t.description.replace(/"/g, '""')}"`,
          t.category,
          t.type,
          t.amount.toFixed(2),
          t.originalAmount ? t.originalAmount.toFixed(2) : '',
          t.originalCurrency || 'INR',
          t.exchangeRate || ''
        ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `niki_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions]);

  return {
    transactions,
    loading,
    addTransaction,
    removeTransaction,
    clearAllData,
    exportPDF,
    exportCSV
  };
};
