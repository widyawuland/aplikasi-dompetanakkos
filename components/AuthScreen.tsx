
import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldCheck, AlertCircle, Mail, ArrowLeft, KeyRound, TimerReset, X, Bell, LogOut, AlertTriangle } from 'lucide-react';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

type AuthMode = 'login' | 'email_setup' | 'create_pin' | 'confirm_pin' | 'recovery_email' | 'verify_otp';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [pin, setPin] = useState<string>('');
  const [email, setEmail] = useState<string>(''); // Email input field
  const [otpInput, setOtpInput] = useState<string>(''); // OTP input
  const [serverOtp, setServerOtp] = useState<string>(''); // Generated OTP
  const [mode, setMode] = useState<AuthMode>('login');
  const [tempPin, setTempPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [shake, setShake] = useState(false);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  
  // State untuk notifikasi OTP Palsu & Modal Reset
  const [showOtpToast, setShowOtpToast] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem('app_pin');
    const savedEmail = localStorage.getItem('app_email');
    
    setStoredEmail(savedEmail);

    if (!savedPin) {
      // Jika belum ada PIN, mulai dari setup Email
      setMode('email_setup');
    } else {
      setMode('login');
    }
  }, []);

  const handleNumberClick = (num: number) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    // Only clear PIN if not in OTP mode (OTP handled separately)
    if (mode !== 'verify_otp') {
       setPin('');
    }
    setTimeout(() => setShake(false), 500);
  };

  // --- LOGIC KIRIM OTP ---
  const sendOtp = (targetEmail: string) => {
    // Generate Random 4 Digit Code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setServerOtp(code);
    
    // TAMPILKAN NOTIFIKASI LAYAR (Simulasi Email Masuk)
    setShowOtpToast(true);
    
    // Sembunyikan notifikasi setelah 10 detik
    setTimeout(() => setShowOtpToast(false), 10000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Masukkan alamat email yang valid');
      return;
    }

    if (mode === 'email_setup') {
      // Simpan email sementara, lanjut buat PIN
      setMode('create_pin');
      setError('');
    } else if (mode === 'recovery_email') {
      // Cek apakah email cocok
      if (email.toLowerCase().trim() === storedEmail?.toLowerCase().trim()) {
        sendOtp(email);
        setMode('verify_otp');
        setError('');
        setOtpInput('');
      } else {
        triggerError('Email tidak cocok dengan data terdaftar.');
      }
    }
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === serverOtp) {
        // OTP Benar -> Izinkan reset PIN
        setMode('create_pin');
        setPin('');
        setTempPin('');
        setError('');
        setOtpInput('');
        setShowOtpToast(false); // Tutup notifikasi jika sukses
        // alert('Verifikasi Berhasil! Silakan buat PIN baru.'); // Optional, UX lebih mulus tanpa alert
    } else {
        triggerError('Kode OTP salah!');
    }
  };

  const handlePinSubmit = () => {
    if (pin.length !== 6) return;

    if (mode === 'login') {
      const savedPin = localStorage.getItem('app_pin');
      if (pin === savedPin) {
        onAuthenticated();
      } else {
        triggerError('PIN Salah');
      }
    } else if (mode === 'create_pin') {
      setTempPin(pin);
      setPin('');
      setMode('confirm_pin');
    } else if (mode === 'confirm_pin') {
      if (pin === tempPin) {
        // Simpan PIN dan Email (jika dari proses setup/recovery)
        localStorage.setItem('app_pin', pin);
        if (email) {
          localStorage.setItem('app_email', email);
          setStoredEmail(email);
        }
        onAuthenticated();
      } else {
        triggerError('PIN tidak cocok, ulangi');
        setMode('create_pin');
        setPin('');
        setTempPin('');
      }
    }
  };

  // Hapus akun dari perangkat (Logout Penuh) - Logic Eksekusi
  const performFullReset = () => {
    localStorage.removeItem('app_pin');
    localStorage.removeItem('app_email');
    setStoredEmail(null);
    setPin('');
    setEmail('');
    setMode('email_setup');
    setShowResetConfirm(false); // Tutup modal
  };

  // Auto submit PIN when 6 digits reached
  useEffect(() => {
    if (pin.length === 6 && (mode === 'login' || mode === 'create_pin' || mode === 'confirm_pin')) {
      const timer = setTimeout(() => handlePinSubmit(), 200);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  const getTitle = () => {
    switch (mode) {
      case 'email_setup': return 'Registrasi Akun';
      case 'create_pin': return 'Buat PIN Baru';
      case 'confirm_pin': return 'Konfirmasi PIN';
      case 'recovery_email': return 'Lupa PIN?';
      case 'verify_otp': return 'Verifikasi Kode';
      default: return 'Masukkan PIN';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'email_setup': return 'Email digunakan untuk memulihkan PIN jika lupa.';
      case 'create_pin': return 'Buat 6 digit angka pengaman.';
      case 'confirm_pin': return 'Masukkan ulang PIN yang sama.';
      case 'recovery_email': return 'Kami akan mengirim kode ke email Anda.';
      case 'verify_otp': return `Masukkan 4 digit kode yang dikirim ke email.`;
      default: return 'Halo! Buka dompetmu.';
    }
  };

  // Render Input Email Form OR OTP Form
  if (mode === 'email_setup' || mode === 'recovery_email' || mode === 'verify_otp') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors relative">
        
        {/* NOTIFIKASI TOAST OTP (SIMULASI EMAIL) */}
        {showOtpToast && (
          <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-l-4 border-blue-500 p-4 z-50 animate-bounce">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full shrink-0 h-fit">
                   <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                   <h4 className="font-bold text-gray-900 dark:text-white text-sm">Email Baru Masuk</h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dari: Sistem Keamanan</p>
                   <div className="mt-2 bg-gray-100 dark:bg-gray-700/50 p-2 rounded text-sm text-gray-800 dark:text-gray-200">
                      Kode Verifikasi Anda: <span className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400 ml-1">{serverOtp}</span>
                   </div>
                </div>
              </div>
              <button onClick={() => setShowOtpToast(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
          
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 shadow-inner">
              {mode === 'verify_otp' ? (
                 <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              ) : (
                 <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 text-center">{getTitle()}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[250px]">{getSubtitle()}</p>
          </div>

          <form onSubmit={mode === 'verify_otp' ? handleOtpVerify : handleEmailSubmit} className="space-y-4 relative z-10">
            {mode === 'verify_otp' ? (
                // OTP INPUT
                <div>
                   <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2 block text-center tracking-wider">Kode OTP</label>
                   <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setOtpInput(val);
                        setError('');
                    }}
                    placeholder="0000"
                    className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-3xl font-bold tracking-[0.5em] placeholder:tracking-normal"
                    autoFocus
                  />
                  <div className="text-center mt-3">
                    <button 
                        type="button" 
                        onClick={() => sendOtp(email)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                    >
                        <TimerReset className="w-3 h-3" /> Kirim Ulang Kode
                    </button>
                  </div>
                </div>
            ) : (
                // EMAIL INPUT
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1 block">Alamat Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>
            )}
            
            {error && (
              <p className={`text-red-500 text-sm flex items-center justify-center gap-1 ${shake ? 'animate-pulse' : ''}`}>
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]"
            >
              {mode === 'email_setup' ? 'Lanjut Buat PIN' : mode === 'verify_otp' ? 'Verifikasi Kode' : 'Kirim Kode'}
            </button>

            {(mode === 'recovery_email' || mode === 'verify_otp') && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setOtpInput('');
                  setShowOtpToast(false);
                }}
                className="w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Login
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Render Numpad (PIN)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-sm">
        
        {/* Header / Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 ring-4 ring-blue-50 dark:ring-blue-900/10 shadow-lg">
            {mode === 'login' ? (
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{getTitle()}</h1>
          
          {/* Tampilkan Email yang sedang Login */}
          {mode === 'login' && storedEmail && (
            <div className="mt-1 flex items-center gap-2 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
              <Mail className="w-3 h-3 text-gray-500" />
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{storedEmail}</p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{getSubtitle()}</p>
        </div>

        {/* PIN Display (Dots) */}
        <div className={`flex justify-center gap-4 mb-8 ${shake ? 'animate-shake' : ''}`}>
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 shadow-sm ${
                i < pin.length 
                  ? 'bg-blue-600 dark:bg-blue-500 scale-110 shadow-blue-500/50' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        <div className="h-6 mb-4 text-center">
          {error && (
            <p className="text-red-500 text-sm font-medium flex items-center justify-center gap-1 animate-fade-in">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="h-16 w-full rounded-2xl bg-white dark:bg-gray-800 text-2xl font-semibold text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 active:bg-gray-50 dark:active:bg-gray-700 transition-all flex items-center justify-center hover:border-blue-200 dark:hover:border-blue-900/30"
            >
              {num}
            </button>
          ))}
          
          <div className="flex items-center justify-center">
             {/* Empty space */}
          </div>

          <button
            onClick={() => handleNumberClick(0)}
            className="h-16 w-full rounded-2xl bg-white dark:bg-gray-800 text-2xl font-semibold text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 active:bg-gray-50 dark:active:bg-gray-700 transition-all flex items-center justify-center hover:border-blue-200 dark:hover:border-blue-900/30"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="h-16 w-full rounded-2xl bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {mode === 'login' && (
           <div className="space-y-3">
             <button 
               type="button"
               onClick={() => {
                 setMode('recovery_email');
                 setEmail('');
                 setError('');
               }}
               className="w-full py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1"
             >
               <KeyRound className="w-3 h-3" />
               Lupa PIN?
             </button>

             <button 
               type="button"
               onClick={() => setShowResetConfirm(true)}
               className="w-full py-2 text-center text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-1"
             >
               <LogOut className="w-3 h-3" />
               Bukan akun Anda? Ganti Akun
             </button>
           </div>
        )}

        {mode === 'create_pin' && email && (
           <p className="text-center text-xs text-gray-400 mt-2">
             Email terdaftar: {email}
           </p>
        )}

      </div>

      {/* Modal Konfirmasi Ganti Akun (Fix untuk masalah window.confirm) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700 animate-slide-up">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ganti Akun?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                PIN dan Email yang tersimpan di perangkat ini akan dihapus. Anda harus mendaftar ulang untuk masuk kembali.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={performFullReset}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  Ya, Ganti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 2;
        }
      `}</style>
    </div>
  );
};
