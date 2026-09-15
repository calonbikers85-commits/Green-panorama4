import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Home, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage({ onOpenConfigModal }) {
  const { login, register, resetPassword } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    block: 'A',
    houseNumber: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!formData.email || !formData.password) {
          throw new Error('Mohon masukkan email dan password.');
        }
        await login(formData.email, formData.password);
        toast.success('Selamat datang kembali di Green Panorama 4!');
      } else if (mode === 'register') {
        if (!formData.fullName.trim()) throw new Error('Nama lengkap wajib diisi.');
        if (!formData.houseNumber.trim()) throw new Error('Nomor rumah wajib diisi.');
        if (!formData.phone.trim()) throw new Error('Nomor WhatsApp aktif wajib diisi.');
        if (!formData.email.trim()) throw new Error('Email aktif wajib diisi.');
        if (formData.password.length < 6) throw new Error('Password minimal 6 karakter.');
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Konfirmasi password tidak cocok.');
        }

        await register({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          block: formData.block,
          houseNumber: formData.houseNumber,
          phone: formData.phone,
        });

        toast.success('Pendaftaran berhasil! Akun Anda kini menunggu verifikasi pengurus RT/RW.');
      } else if (mode === 'forgot') {
        if (!formData.email.trim()) throw new Error('Mohon masukkan email Anda.');
        await resetPassword(formData.email);
        toast.success('Email instruksi reset password telah dikirim ke kotak masuk Anda.');
        setMode('login');
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Terjadi kesalahan. Silakan coba lagi.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Email atau password yang Anda masukkan salah.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email ini sudah terdaftar. Silakan login.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'Akun dengan email ini tidak ditemukan.';
      }
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick autofill demo accounts
  const autofill = (role) => {
    if (role === 'admin') {
      setFormData((prev) => ({
        ...prev,
        email: 'admin@greenpanorama.com',
        password: 'password123',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        email: 'budi@warga.com',
        password: 'password123',
      }));
    }
    setMode('login');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient blurred lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl mb-3">
            <img 
              src="/favicon.svg" 
              alt="Logo Green Panorama 4" 
              className="w-14 h-14 object-contain rounded-xl"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Green Panorama <span className="text-emerald-400">4</span>
          </h1>
          <p className="mt-1 text-sm text-emerald-200/80 font-medium">
            Portal Digital & Layanan Warga Komplek
          </p>
        </div>

        {/* Card Container */}
        <div className="mt-6 bg-white/95 backdrop-blur-xl py-7 px-6 sm:px-8 rounded-3xl shadow-2xl border border-white/30">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login' 
                  ? 'bg-white text-emerald-800 shadow-sm' 
                  : 'hover:text-slate-900'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(''); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'register' 
                  ? 'bg-white text-emerald-800 shadow-sm' 
                  : 'hover:text-slate-900'
              }`}
            >
              Daftar Akun
            </button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration specific fields */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Blok Rumah
                    </label>
                    <select
                      name="block"
                      value={formData.block}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-semibold text-slate-800"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((b) => (
                        <option key={b} value={b}>Blok {b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor Rumah
                    </label>
                    <div className="relative">
                      <Home className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="houseNumber"
                        required
                        placeholder="Contoh: 14"
                        value={formData.houseNumber}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor WhatsApp Aktif
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="081234567890"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Password Field (except in forgot mode) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Kata Sandi
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMessage(''); }}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                    >
                      Lupa Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password for Register */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    placeholder="Ulangi kata sandi"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Masuk ke Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'register' ? (
                <>
                  <span>Kirim Pendaftaran Warga</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Kirim Link Reset Password</span>
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-600 hover:text-emerald-700 font-semibold"
                >
                  ← Kembali ke Halaman Login
                </button>
              </div>
            )}
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Akses Cepat Pengujian:
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => autofill('admin')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Akun Admin RT
              </button>
              <button
                type="button"
                onClick={() => autofill('resident')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Akun Warga (Budi)
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Komplek Green Panorama 4 &bull; Lingkungan Asri, Aman, dan Harmonis
        </p>
      </div>
    </div>
  );
}
