import React, { useState } from 'react';
import { PlusCircle, ChevronDown } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';

interface InputFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ onAddTransaction }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(Category.FOOD);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  const incomeCategories = [
    Category.INITIAL_BALANCE,
    Category.PARENT_TRANSFER,
    Category.SALARY,
    Category.FREELANCE,
    Category.GIFT,
    Category.OTHERS
  ];

  const expenseCategories = [
    Category.FOOD,
    Category.TRANSPORT,
    Category.SHOPPING,
    Category.UTILITIES,
    Category.INTERNET,
    Category.ENTERTAINMENT,
    Category.OTHERS
  ];

  const currentCategories = type === TransactionType.INCOME ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    if (!date) return;
    if (!note.trim()) return;

    onAddTransaction({
      type,
      amount: Number(amount),
      category,
      date,
      note,
    });

    setAmount('');
    setNote('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-blue-500" />
        Tambah Transaksi Baru
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors">
          <button
            type="button"
            onClick={() => setType(TransactionType.EXPENSE)}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
              type === TransactionType.EXPENSE
                ? 'bg-white dark:bg-red-500/20 text-red-600 dark:text-red-500 border border-gray-200 dark:border-red-500/50 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType(TransactionType.INCOME)}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
              type === TransactionType.INCOME
                ? 'bg-white dark:bg-green-500/20 text-green-600 dark:text-green-500 border border-gray-200 dark:border-green-500/50 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Pemasukan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Kategori <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-3 pr-10 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Jumlah (Rp) <span className="text-red-500">*</span></label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Keterangan <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Nasi Padang, Bayar Listrik..."
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-2"
        >
          Simpan Transaksi
        </button>
      </form>
    </div>
  );
};