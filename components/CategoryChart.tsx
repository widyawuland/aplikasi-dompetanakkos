import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { PieChart, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface CategoryChartProps {
  transactions: Transaction[];
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ transactions }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);

  const data = useMemo(() => {
    const filtered = transactions.filter((t) => t.type === type);
    const total = filtered.reduce((acc, t) => acc + t.amount, 0);
    
    const byCategory: Record<string, number> = {};
    filtered.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    return Object.entries(byCategory)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, type]);

  // Colors for chart segments
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6366f1', // indigo
  ];

  // Create conic gradient string for the donut chart
  const gradientString = useMemo(() => {
    if (data.length === 0) return '#374151 0% 100%'; // fallback if empty (will handle below)

    let currentDeg = 0;
    const segments = data.map((item, index) => {
      const start = currentDeg;
      const deg = (item.percentage / 100) * 360;
      currentDeg += deg;
      return `${colors[index % colors.length]} ${start}deg ${currentDeg}deg`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }, [data]);

  const emptyColor = useMemo(() => {
     // We can't easily detect system theme in js variable here without context/hooks for tailwind, 
     // but we can use CSS classes for the container. 
     // However for the gradient background style string, we need a color. 
     // We'll handle "empty" state visual purely in CSS if possible or just use a neutral gray.
     return '#9ca3af'; // gray-400
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg w-full transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          Statistik
        </h2>
      </div>
      
      {/* Full Width Tabs similar to InputForm */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6 transition-colors">
        <button
          onClick={() => setType(TransactionType.EXPENSE)}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            type === TransactionType.EXPENSE 
              ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm ring-1 ring-gray-200 dark:ring-red-500/20' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Pengeluaran
        </button>
        <button
          onClick={() => setType(TransactionType.INCOME)}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            type === TransactionType.INCOME 
              ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm ring-1 ring-gray-200 dark:ring-green-500/20' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Pemasukan
        </button>
      </div>

      <div className="flex flex-col items-center w-full">
        {/* Donut Chart */}
        <div className="relative w-48 h-48 mb-6 shrink-0">
          <div 
            className="w-full h-full rounded-full transition-all duration-500 shadow-2xl"
            style={{ background: data.length > 0 ? gradientString : '#e5e7eb' }} // #e5e7eb is gray-200
          >
            {/* Dark mode override for empty state background using CSS since inline style is rigid */}
             {data.length === 0 && (
               <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 absolute top-0 left-0"></div>
             )}
          </div>
          <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center flex-col shadow-inner transition-colors">
             <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Total</span>
             <span className={`text-lg font-bold ${type === TransactionType.INCOME ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {data.length > 0 
                  ? `${(data[0].percentage).toFixed(0)}%`
                  : '0%'}
             </span>
             <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 max-w-[80%] text-center truncate px-2">
                {data.length > 0 ? data[0].name : 'Kosong'}
             </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full space-y-3">
          {data.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-500 text-sm py-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 transition-colors">Belum ada data transaksi.</p>
          ) : (
            data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-800" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Rp {item.value.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};