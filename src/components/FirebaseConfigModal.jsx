import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Key, Save, RefreshCw } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function FirebaseConfigModal({ isOpen, onClose }) {
  const { isRealFirebase, configSource } = useAuth();
  const toast = useToast();

  const [rawConfig, setRawConfig] = useState(() => {
    const saved = localStorage.getItem('gp4_custom_firebase_config');
    return saved || '';
  });

  const handleSaveConfig = () => {
    try {
      if (!rawConfig.trim()) {
        localStorage.removeItem('gp4_custom_firebase_config');
        toast.info('Konfigurasi Firebase kustom dihapus.');
        setTimeout(() => window.location.reload(), 800);
        return;
      }

      let parsed;
      if (rawConfig.trim().startsWith('{')) {
        parsed = JSON.parse(rawConfig);
      } else {
        // Attempt to parse apiKey = ... format
        const lines = rawConfig.split('\n');
        parsed = {};
        lines.forEach(l => {
          const parts = l.split('=');
          if (parts.length === 2) {
            const k = parts[0].trim().replace(/^VITE_FIREBASE_/, '').toLowerCase();
            parsed[k] = parts[1].trim();
          }
        });
      }

      if (!parsed.apiKey || !parsed.projectId) {
        toast.error('Format JSON tidak valid. Pastikan ada apiKey dan projectId.');
        return;
      }

      localStorage.setItem('gp4_custom_firebase_config', JSON.stringify(parsed, null, 2));
      toast.success('Konfigurasi Firebase berhasil disimpan! Memuat ulang...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      toast.error('Gagal memproses konfigurasi JSON: ' + e.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan & Status Firebase" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Status indicator */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          isRealFirebase 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          {isRealFirebase ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm">
              {isRealFirebase 
                ? 'Terhubung Langsung ke Firebase Cloud' 
                : 'Mode Simulasi / Siap Integrasi Firebase'}
            </p>
            <p className="text-xs mt-1 text-slate-600 leading-relaxed">
              {isRealFirebase
                ? 'Autentikasi, Firestore, dan Storage aktif dan tersinkronisasi realtime dengan cloud Firebase.'
                : 'Semua operasi CRUD, realtime stream, dan autentikasi berjalan aktif di browser. Masukkan konfigurasi Firebase Web Console di bawah ini untuk menghubungkan langsung ke project Firebase Anda.'}
            </p>
          </div>
        </div>

        {/* Environment variable helper */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Konfigurasi Firebase Web (JSON / Objek SDK)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Salin konfigurasi Firebase Web App Anda dari Firebase Console &gt; Project Settings &gt; General:
          </p>
          <textarea
            rows={7}
            value={rawConfig}
            onChange={(e) => setRawConfig(e.target.value)}
            placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "green-panorama-4.firebaseapp.com",\n  "projectId": "green-panorama-4",\n  "storageBucket": "green-panorama-4.appspot.com",\n  "messagingSenderId": "1234567890",\n  "appId": "1:1234567890:web:..."\n}`}
            className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-300 rounded-xl border border-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Tips Deployment Vercel:</p>
          <p>Tambahkan environment variables di dashboard Vercel sesuai file <code className="text-emerald-700 font-mono">.env.example</code> untuk otomatisasi saat build.</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              localStorage.removeItem('gp4_local_db_v1');
              toast.info('Database lokal direset.');
              setTimeout(() => window.location.reload(), 500);
            }}
            type="button"
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Reset Data Lokal
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Tutup
            </button>
            <button
              onClick={handleSaveConfig}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
