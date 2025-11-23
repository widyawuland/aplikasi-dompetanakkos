
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TransactionType, FinancialSummary, Category } from './types';
import { InputForm } from './components/InputForm';
import { TransactionList } from './components/TransactionList';
import { Summary } from './components/Summary';
import { CategoryChart } from './components/CategoryChart';
import { AuthScreen } from './components/AuthScreen';
import { generateFinancialAdvice } from './services/geminiService';
import { Wallet, Save, Trash2, X, AlertTriangle, FileText, CheckCircle2, Lock, LogOut } from 'lucide-react';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Gagal memuat data dari LocalStorage", e);
      return [];
    }
  });
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // State for Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMode, setResetMode] = useState<'all' | 'year' | 'month'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // State for Restore Modal
  const [restoreCandidates, setRestoreCandidates] = useState<Transaction[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  
  // Ref for File Input (Restore)
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if PIN exists
    const savedPin = localStorage.getItem('app_pin');
    if (!savedPin) {
      // No PIN setup yet, force user to create one by showing Auth Screen but logic handled inside AuthScreen
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(false);
    }
    setIsAuthChecking(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions, isAuthenticated]);

  // Helper aman untuk generate ID
  const generateSafeId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: generateSafeId(),
    };
    setTransactions((prev) => [transaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // --- LOGIC BACKUP ---
  const handleBackup = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `backup-dompet-anak-kos-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // --- HELPERS UNTUK RESTORE ---
  
  // Membersihkan format angka (misal: "10.000" -> 10000)
  const cleanNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // Hapus "Rp", spasi, dan karakter aneh
      let clean = val.replace(/[^0-9,.-]/g, '');
      
      // Deteksi format Indonesia (titik sebagai ribuan)
      // Jika ada titik tapi tidak ada koma, atau titik muncul sebelum koma (dan koma cuma 1 di akhir)
      if (clean.includes('.') && !clean.includes(',')) {
         // Asumsi 10.000 adalah sepuluh ribu
         clean = clean.replace(/\./g, ''); 
      } else if (clean.includes('.') && clean.includes(',')) {
         // Format 10.000,00 -> Hapus titik, ganti koma dengan titik (untuk JS float)
         clean = clean.replace(/\./g, '').replace(',', '.');
      }
      
      return parseFloat(clean) || 0;
    }
    return 0;
  };

  // Membersihkan format tanggal ke YYYY-MM-DD
  const cleanDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    
    try {
      let dateStr = String(val).split('T')[0]; // Ambil bagian tanggal saja jika ISO string
      
      // Cek format DD/MM/YYYY atau DD-MM-YYYY (Indonesia)
      if (dateStr.includes('/') || (dateStr.includes('-') && dateStr.split('-')[0].length === 2)) {
         const parts = dateStr.split(/[-/]/); // Split by - or /
         if (parts.length === 3) {
            // Asumsi parts[0] = DD, parts[1] = MM, parts[2] = YYYY
            // Perlu dibalik jadi YYYY-MM-DD
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
         }
      }
      
      // Cek validitas
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
      
      return dateStr;
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  // --- LOGIC RESTORE UTAMA ---
  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
      fileInputRef.current.click();
    } else {
      alert("Terjadi kesalahan sistem: Komponen input file tidak ditemukan.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          alert('File kosong!');
          return;
        }

        let parsedData;
        try {
          parsedData = JSON.parse(content);
        } catch (jsonErr) {
          alert('Format file error. Pastikan file JSON yang benar.');
          return;
        }
        
        // Handle wrapper object
        let dataToProcess: any[] = [];
        if (Array.isArray(parsedData)) {
          dataToProcess = parsedData;
        } else if (typeof parsedData === 'object' && parsedData !== null) {
          if (Array.isArray(parsedData.transactions)) dataToProcess = parsedData.transactions;
          else if (Array.isArray(parsedData.data)) dataToProcess = parsedData.data;
          else {
             const arrayValue = Object.values(parsedData).find(val => Array.isArray(val));
             if (arrayValue) dataToProcess = arrayValue as any[];
          }
        }

        if (dataToProcess.length === 0) {
          alert('Tidak ada data transaksi yang ditemukan dalam file.');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Proses Mapping yang Robust
        const validTransactions: Transaction[] = [];
        let successCount = 0;

        dataToProcess.forEach((item: any) => {
          if (!item || typeof item !== 'object') return;

          // 1. Amount
          const rawAmount = item.amount ?? item.nominal ?? item.jumlah ?? item.value ?? item.harga;
          const amount = cleanNumber(rawAmount);
          if (amount <= 0) return; // Skip jika 0 atau gagal parse

          // 2. Type
          let type = TransactionType.EXPENSE;
          const rawType = String(item.type || item.jenis || '').toLowerCase();
          if (rawType.includes('masuk') || rawType.includes('income') || rawType.includes('tambah')) {
            type = TransactionType.INCOME;
          }

          // 3. Date
          const rawDate = item.date ?? item.tanggal ?? item.tgl ?? item.createdAt ?? item.waktu;
          const date = cleanDate(rawDate);

          // 4. Category
          const category = item.category ?? item.kategori ?? 'Lainnya';
          
          // 5. Note
          const note = item.note ?? item.desc ?? item.description ?? item.keterangan ?? item.catatan ?? 'Restore Data';

          validTransactions.push({
            id: generateSafeId(), // Selalu generate ID baru untuk hindari konflik
            type,
            amount,
            category,
            date,
            note
          });
          successCount++;
        });

        if (successCount === 0) {
           alert('Gagal membaca data. Pastikan format file sesuai.');
           if (fileInputRef.current) fileInputRef.current.value = '';
           return;
        }

        // Simpan ke state dan tampilkan modal
        setRestoreCandidates(validTransactions);
        setShowRestoreModal(true);
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error) {
        console.error("Error parsing backup:", error);
        alert('Terjadi kesalahan saat memproses file.');
      }
    };
    
    reader.onerror = () => alert('Browser gagal membaca file.');
    reader.readAsText(file);
  };

  const handleMergeRestore = () => {
    const merged = [...transactions, ...restoreCandidates];
    // Urutkan berdasarkan tanggal descending
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setTransactions(merged);
    setShowRestoreModal(false);
    setRestoreCandidates([]);
    alert(`Berhasil menambahkan ${restoreCandidates.length} transaksi!`);
  };

  const handleReplaceRestore = () => {
    setTransactions(restoreCandidates);
    setAiAnalysis(''); 
    setShowRestoreModal(false);
    setRestoreCandidates([]);
    alert(`Berhasil memulihkan ${restoreCandidates.length} transaksi! (Data lama dihapus)`);
  };

  // --- LOGIC RESET & KEEP BALANCE ---
  const calculateCurrentBalance = (txs: Transaction[]) => {
    return txs.reduce((acc, t) => {
      return t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount;
    }, 0);
  };

  const handleResetConfirm = () => {
    const currentBalance = calculateCurrentBalance(transactions);
    
    let newTransactions = [...transactions];

    if (resetMode === 'all') {
      newTransactions = [];
    } else if (resetMode === 'month') {
      newTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return !(tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear);
      });
    } else if (resetMode === 'year') {
      newTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() !== selectedYear;
      });
    }

    const remainingBalance = calculateCurrentBalance(newTransactions);
    const adjustmentNeeded = currentBalance - remainingBalance;

    if (adjustmentNeeded !== 0) {
      const monthName = new Date(selectedYear, selectedMonth).toLocaleString('id-ID', { month: 'long' });
      let noteLabel = 'Sisa Saldo';
      
      if (resetMode === 'all') noteLabel += ' (Reset Semua)';
      else if (resetMode === 'month') noteLabel += ` (Reset ${monthName} ${selectedYear})`;
      else if (resetMode === 'year') noteLabel += ` (Reset Tahun ${selectedYear})`;

      const adjustmentTx: Transaction = {
        id: generateSafeId(),
        type: adjustmentNeeded > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
        amount: Math.abs(adjustmentNeeded),
        category: Category.INITIAL_BALANCE,
        date: new Date().toISOString().split('T')[0],
        note: noteLabel
      };
      newTransactions = [adjustmentTx, ...newTransactions];
    }

    setTransactions(newTransactions);
    setShowResetModal(false);
    setAiAnalysis(''); 
    alert('Reset berhasil! Sisa uang Anda tetap aman.');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const summary: FinancialSummary = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expenseByCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .forEach((t) => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });
    
    let topCategory = '-';
    let maxAmount = 0;
    
    Object.entries(expenseByCategory).forEach(([cat, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        topCategory = cat;
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      topExpenseCategory: topCategory,
    };
  }, [transactions]);

  const handleGenerateReport = async () => {
    setIsAnalyzing(true);
    try {
      const advice = await generateFinancialAdvice(transactions);
      setAiAnalysis(advice);
    } catch (error) {
      console.error(error);
      setAiAnalysis("Gagal menghubungi server AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 10}, (_, i) => currentYear - 5 + i);

  if (isAuthChecking) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans pb-20 relative transition-colors duration-300">
      <nav className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                Dompet<span className="text-blue-600 dark:text-blue-400">AnakKos</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Kelola Uang Saku Menjadi Lebih Mudah</span>
                <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-400/20">
                  <Lock className="w-3 h-3" /> Secured
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-xs text-gray-500 font-medium">
              v2.9 Secure Update
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
              title="Kunci Aplikasi"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 font-medium flex items-center gap-2">
              Halo, selamat datang! <span className="animate-wave">👋</span>
            </p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Ringkasan Keuangan</h2>
          </div>
        </div>

        {/* Hidden Input for Restore */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          className="hidden" 
        />

        <Summary 
          summary={summary} 
          aiAnalysis={aiAnalysis}
          onGenerateReport={handleGenerateReport}
          isLoading={isAnalyzing}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6 w-full">
             <InputForm onAddTransaction={addTransaction} />
             <CategoryChart transactions={transactions} />
          </div>

          <div className="lg:col-span-7 w-full h-full">
            <TransactionList 
              transactions={transactions} 
              onDelete={deleteTransaction} 
              onBackup={handleBackup}
              onRestore={handleRestoreClick}
              onReset={() => setShowResetModal(true)}
            />
          </div>
        </div>

      </main>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-colors animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-[400px] w-full overflow-hidden flex flex-col max-h-[90vh] animate-slide-up transition-colors">
            
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Reset Riwayat Transaksi
              </h3>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
                    <span className="font-semibold text-yellow-700 dark:text-yellow-500 block mb-1">Perhatian</span>
                    Tindakan ini akan menghapus data riwayat. Sisa saldo terakhir akan otomatis disimpan sebagai "Saldo Awal".
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Pilih Mode Reset:</p>

              <div className="space-y-3">
                <div 
                  onClick={() => setResetMode('all')}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    resetMode === 'all' 
                      ? 'bg-blue-50 dark:bg-gray-700 border-blue-500 ring-1 ring-blue-500/50' 
                      : 'bg-white dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${resetMode === 'all' ? 'border-blue-500' : 'border-gray-400 dark:border-gray-500'}`}>
                    {resetMode === 'all' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Reset Semua Data</span>
                </div>

                <div 
                  onClick={() => setResetMode('year')}
                  className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    resetMode === 'year' 
                      ? 'bg-blue-50 dark:bg-gray-700 border-blue-500 ring-1 ring-blue-500/50' 
                      : 'bg-white dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                     <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${resetMode === 'year' ? 'border-blue-500' : 'border-gray-400 dark:border-gray-500'}`}>
                        {resetMode === 'year' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                     </div>
                     <span className="text-sm font-medium text-gray-900 dark:text-white">Reset Per Tahun</span>
                  </div>

                  {resetMode === 'year' && (
                    <div className="mt-2 ml-8 animate-fade-in">
                       <select 
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2 focus:border-blue-500 outline-none w-24 shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                       >
                          {years.map((y) => (
                             <option key={y} value={y}>{y}</option>
                          ))}
                       </select>
                    </div>
                  )}
                </div>

                <div 
                  onClick={() => setResetMode('month')}
                  className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    resetMode === 'month' 
                      ? 'bg-blue-50 dark:bg-gray-700 border-blue-500 ring-1 ring-blue-500/50' 
                      : 'bg-white dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${resetMode === 'month' ? 'border-blue-500' : 'border-gray-400 dark:border-gray-500'}`}>
                      {resetMode === 'month' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Reset Per Bulan</span>
                  </div>

                  {resetMode === 'month' && (
                    <div className="mt-2 ml-8 flex gap-2 animate-fade-in">
                       <select 
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2 focus:border-blue-500 outline-none w-full shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                       >
                          {months.map((m, idx) => (
                             <option key={idx} value={idx}>{m}</option>
                          ))}
                       </select>
                       <select 
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2 focus:border-blue-500 outline-none w-24 shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                       >
                          {years.map((y) => (
                             <option key={y} value={y}>{y}</option>
                          ))}
                       </select>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 flex gap-3">
              <button 
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 px-4 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleResetConfirm}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 dark:shadow-red-900/30 transition-all active:scale-[0.98]"
              >
                Hapus & Simpan Saldo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-colors animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-[450px] w-full overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Konfirmasi Restore Data
              </h3>
              <button 
                onClick={() => {
                   setShowRestoreModal(false);
                   setRestoreCandidates([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
               <div className="flex items-center gap-4 mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0">
                     <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                     <p className="text-sm text-gray-500 dark:text-gray-400">File berhasil dibaca</p>
                     <p className="text-xl font-bold text-gray-900 dark:text-white">{restoreCandidates.length} Transaksi</p>
                  </div>
               </div>

               <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Bagaimana Anda ingin memproses data ini?
               </p>

               <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleMergeRestore}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group text-left"
                  >
                     <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0 group-hover:scale-110 transition-transform">
                        <Save className="w-5 h-5" />
                     </div>
                     <div>
                        <span className="block font-semibold text-gray-900 dark:text-white">Gabungkan (Merge)</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Tambahkan ke data yang sudah ada.</span>
                     </div>
                  </button>

                  <button
                    onClick={handleReplaceRestore}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-400 bg-white dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group text-left"
                  >
                     <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 group-hover:scale-110 transition-transform">
                        <Trash2 className="w-5 h-5" />
                     </div>
                     <div>
                        <span className="block font-semibold text-gray-900 dark:text-white">Timpa (Replace)</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Hapus data lama, ganti dengan ini.</span>
                     </div>
                  </button>
               </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
               <button 
                  onClick={() => {
                     setShowRestoreModal(false);
                     setRestoreCandidates([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
               >
                  Batal
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
