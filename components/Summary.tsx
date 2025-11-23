import React from 'react';
import { FinancialSummary } from '../types';
import { Sparkles, ArrowUpCircle, ArrowDownCircle, Wallet, Loader2, RefreshCw } from 'lucide-react';

interface SummaryProps {
  summary: FinancialSummary;
  aiAnalysis: string;
  onGenerateReport: () => void;
  isLoading: boolean;
}

export const Summary: React.FC<SummaryProps> = ({ summary, aiAnalysis, onGenerateReport, isLoading }) => {
  return (
    <div className="space-y-6">
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-green-100 dark:bg-green-500/10 rounded-full">
            <ArrowUpCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pemasukan</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              Rp {summary.totalIncome.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Expense */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-full">
            <ArrowDownCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pengeluaran</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              Rp {summary.totalExpense.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-full">
            <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Sisa Uang (Total)</p>
            <p className={`text-xl font-bold ${summary.balance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
              Rp {summary.balance.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* AI Analysis Section - Purple Banner (Always Dark theme for contrast) */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-900 opacity-20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              <h3 className="font-bold text-xl">Sobat Hemat AI</h3>
            </div>
            <button
              onClick={onGenerateReport}
              disabled={isLoading}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-lg ring-1 ring-white/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sedang Menganalisis...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Minta Saran
                </>
              )}
            </button>
          </div>

          <div className="bg-white/10 rounded-xl p-5 backdrop-blur-md border border-white/10 min-h-[120px] flex items-center justify-center text-center">
             {aiAnalysis ? (
               <div className="prose prose-sm max-w-none text-left w-full leading-relaxed text-white">
                 {aiAnalysis.split('\n').map((line, i) => (
                   <p key={i} className="mb-2 last:mb-0">{line}</p>
                 ))}
               </div>
             ) : (
               <div className="flex flex-col items-center gap-2 opacity-80">
                 <p className="font-medium">Klik "Minta Saran" untuk dapatkan analisis keuangan & tips hemat dari AI!</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};