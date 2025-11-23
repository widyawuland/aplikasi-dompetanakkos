import React, { useState } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { Trash2, Search, Filter, Calendar, SearchX, ChevronDown, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onBackup: () => void;
  onRestore: () => void;
  onReset: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onDelete,
  onBackup,
  onRestore,
  onReset
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtering Logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.note || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory ? t.category === filterCategory : true;
    
    let matchesDate = true;
    if (startDate && endDate) {
      matchesDate = t.date >= startDate && t.date <= endDate;
    } else if (startDate) {
      matchesDate = t.date >= startDate;
    } else if (endDate) {
      matchesDate = t.date <= endDate;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  // Sort by date descending
  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const categories = Object.values(Category);

  // Safe date formatter
  const formatDateSafe = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Tanggal Invalid';
      return format(date, 'dd MMMM yyyy', { locale: idLocale });
    } catch (e) {
      return 'Error Tanggal';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg min-h-[600px] flex flex-col transition-colors">
      
      {/* Header & Filters */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 space-y-4 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
        
        {/* Title & Actions Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            Riwayat Transaksi
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full">{filteredTransactions.length}</span>
          </h3>

          {/* Action Buttons (Backup, Restore, Reset) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button 
               type="button"
               onClick={onBackup}
               className="flex-1 sm:flex-none p-2 bg-white dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all border border-gray-200 dark:border-gray-600/50 text-xs font-medium flex items-center justify-center gap-2 group shadow-sm"
               title="Backup Data"
             >
               <Upload className="w-4 h-4" />
               <span className="sm:hidden lg:inline">Backup</span>
             </button>
             
             <button 
               type="button"
               onClick={onRestore}
               className="flex-1 sm:flex-none p-2 bg-white dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all border border-gray-200 dark:border-gray-600/50 text-xs font-medium flex items-center justify-center gap-2 group shadow-sm"
               title="Restore Data"
             >
               <Download className="w-4 h-4" />
               <span className="sm:hidden lg:inline">Restore</span>
             </button>

             <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

             <button 
               type="button"
               onClick={onReset}
               className="flex-1 sm:flex-none p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-all border border-red-200 dark:border-red-500/20 text-xs font-medium flex items-center justify-center gap-2 group"
               title="Reset Data"
             >
               <Trash2 className="w-4 h-4" />
               <span className="sm:hidden lg:inline">Reset</span>
             </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search */}
          <div className="md:col-span-4 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl pl-10 pr-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3 relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl pl-10 pr-8 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>

          {/* Date Filter */}
          <div className="md:col-span-5 flex gap-2">
            <div className="relative flex-1 group">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
               <input 
                 type="text" 
                 onFocus={(e) => e.target.type = 'date'}
                 onBlur={(e) => e.target.type = 'text'}
                 placeholder="Dari"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl pl-10 pr-2 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
               />
            </div>
            <div className="relative flex-1 group">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
               <input 
                 type="text" 
                 onFocus={(e) => e.target.type = 'date'}
                 onBlur={(e) => e.target.type = 'text'}
                 placeholder="Sampai"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl pl-10 pr-2 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
               />
            </div>
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-x-auto">
        {transactions.length === 0 ? (
           <div className="text-center py-20 flex flex-col items-center">
             <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6 ring-8 ring-gray-50 dark:ring-gray-800 transition-colors">
               <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400 dark:text-gray-500" />
             </div>
             <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Belum ada transaksi</h3>
             <p className="text-gray-500 dark:text-gray-400">Mulai catat pengeluaranmu hari ini!</p>
           </div>
        ) : filteredTransactions.length === 0 ? (
           <div className="text-center py-20 flex flex-col items-center">
             <SearchX className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
             <p className="text-gray-500 dark:text-gray-400 font-medium">Tidak ada transaksi yang cocok dengan filter.</p>
           </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-100/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 transition-colors">
                <th className="px-4 sm:px-6 py-4 font-medium">Tanggal</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Keterangan</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Kategori</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-right">Jumlah</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-center w-[80px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
              {sortedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatDateSafe(t.date)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-200 font-medium max-w-[200px] truncate" title={t.note}>
                    {t.note || '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-4 sm:px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${
                    t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {t.type === TransactionType.INCOME ? '+ ' : '- '}
                    Rp {t.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-all border border-red-200 dark:border-red-500/20 active:scale-95"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};