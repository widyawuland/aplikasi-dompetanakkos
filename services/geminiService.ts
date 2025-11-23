import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType } from "../types";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not set in the environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  const ai = getGeminiClient();
  if (!ai) return "Maaf, kunci API tidak ditemukan. Tidak dapat menghasilkan analisis.";

  if (transactions.length === 0) {
    return "Belum ada data transaksi untuk dianalisis. Tambahkan transaksi pengeluaran dan pemasukanmu!";
  }

  // Filter relevant data to send to avoid token limits if list is huge (taking last 50 for context usually enough)
  const recentTransactions = transactions.slice(0, 50).map(t => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date,
    note: t.note
  }));

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const prompt = `
    Saya adalah "Anak Kos" (mahasiswa yang tinggal di asrama/kos). 
    Berikut adalah data keuangan saya bulan ini dalam format JSON:
    ${JSON.stringify(recentTransactions)}

    Ringkasan Kasar:
    Total Pemasukan: ${totalIncome}
    Total Pengeluaran: ${totalExpense}

    Tugasmu:
    Berikan analisis keuangan singkat (maksimal 3 paragraf pendek) dengan gaya bahasa santai, akrab, dan sedikit humor khas anak muda Indonesia.
    1. Komentari kebiasaan pengeluaran saya.
    2. Jika pengeluaran lebih besar dari pemasukan, berikan peringatan lucu.
    3. Jika saya hemat, berikan pujian.
    4. Soroti kategori pengeluaran terbesar.
    
    Gunakan format Markdown untuk output teks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Low latency preferred for simple analysis
      }
    });

    return response.text || "Gagal mendapatkan analisis dari Gemini.";
  } catch (error) {
    console.error("Error generating financial advice:", error);
    return "Terjadi kesalahan saat menghubungi asisten keuangan AI.";
  }
};