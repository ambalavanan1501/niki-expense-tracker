import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const STORAGE_KEY = 'lumina_transactions_v1';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse transactions', e);
      }
    }
  }, []);

  // Save to local storage whenever transactions change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllData = useCallback(() => {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      setTransactions([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("Lumina Expense Report", 14, 22);
    
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

    doc.save(`lumina_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [transactions]);

  const exportCSV = useCallback(() => {
    // Define headers
    const headers = ['ID', 'Date', 'Description', 'Category', 'Type', 'Amount (INR)', 'Original Amount', 'Currency', 'Exchange Rate'];
    
    // Map data to CSV format
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => {
        const row = [
          t.id,
          t.date,
          `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
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

    // Create Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `lumina_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    removeTransaction,
    clearAllData,
    exportPDF,
    exportCSV
  };
};
