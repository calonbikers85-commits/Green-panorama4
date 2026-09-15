import React, { useState } from 'react';
import { 
  Clock, 
  ShieldAlert, 
  Home, 
  Phone, 
  Mail, 
  LogOut, 
  RefreshCw, 
  MessageCircle, 
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function PendingApprovalPage() {
  const { userProfile, logout } = useAuth();
  const toast = useToast();
  const [checking, setChecking] = useState(false);

  const isRejected = userProfile?.status === 'rejected';

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      toast.info('Memeriksa status persetujuan dari server...');
      window.location.reload();
    }, 800);
  };

  const adminWhatsAppUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(
    `Halo Pengurus RT Green Panorama 4, saya ${userProfile?.fullName || 'Warga'} dari Blok ${userProfile?.block || ''} No ${userProfile?.houseNumber || ''} ingin konfirmasi pendaftaran akun warga.`
  )}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Top Header Pattern */}
        <div className={`h-2 absolute top-0 left-0 right-0 ${isRejected ? 'bg-rose-500' : 'bg-amber-500'}`} />

        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          {isRejected ? (
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-9 h-9" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center animate-pulse">
              <Clock className="w-9 h-9" />
            </div>
          )}
        </div>

        <h2 className="text-xl font-extrabold text-slate-800">
          {isRejected ? 'Pendaftaran Memerlukan Klarifikasi' : 'Menunggu Persetujuan Pengurus'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          {isRejected ? (
            userProfile?.rejectReason || 'Data registrasi Anda belum dapat diverifikasi oleh pengurus. Silakan hubungi admin RT/RW di bawah ini.'
          ) : (
            'Terima kasih telah mendaftar di Portal Green Panorama 4. Demi keamanan komplek, akun warga baru wajib diverifikasi oleh Pengurus RT/RW sebelum dapat mengakses portal.'
          )}
        </p>

        {/* Resident details card */}
        <div className="mt-6 bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Nama Warga:</span>
            <span className="font-bold text-slate-800">{userProfile?.fullName || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Alamat Rumah:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Blok {userProfile?.block || '-'} No. {userProfile?.houseNumber || '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">WhatsApp:</span>
            <span className="font-semibold text-slate-700">{userProfile?.phone || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Email:</span>
            <span className="font-semibold text-slate-700 truncate max-w-[180px]">{userProfile?.email || '-'}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-400">Status Akun:</span>
            <span className={`font-bold uppercase tracking-wider text-[11px] ${
              isRejected ? 'text-rose-600' : 'text-amber-600'
            }`}>
              {isRejected ? 'Ditolak / Perlu Klarifikasi' : 'Sedang Ditinjau'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <a
            href={adminWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Konfirmasi ke WhatsApp Admin RT</span>
          </a>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{checking ? 'Memeriksa...' : 'Cek Status Persetujuan'}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-rose-600 text-xs font-semibold transition-colors mt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
