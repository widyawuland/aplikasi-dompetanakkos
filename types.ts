export enum TransactionType {
  INCOME = 'Pemasukan',
  EXPENSE = 'Pengeluaran',
}

export enum Category {
  // Common
  FOOD = 'Makan & Minum',
  TRANSPORT = 'Transportasi',
  SHOPPING = 'Belanja',
  UTILITIES = 'Tagihan (Listrik/Air)',
  INTERNET = 'Data & Wifi',
  ENTERTAINMENT = 'Hiburan',
  
  // Income specific (based on screenshot)
  INITIAL_BALANCE = 'Saldo Awal',
  PARENT_TRANSFER = 'Kiriman Ortu',
  SALARY = 'Gaji/Upah',
  FREELANCE = 'Freelance',
  GIFT = 'Hadiah',
  
  OTHERS = 'Lainnya',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category | string;
  date: string;
  note?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topExpenseCategory: string;
}
