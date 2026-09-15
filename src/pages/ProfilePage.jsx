import React, { useState } from 'react';
import { 
  UserCircle, 
  Home, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Camera, 
  Save, 
  LogOut, 
  PhoneCall, 
  Building,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { uploadImageFile } from '../firebase/services';
import Badge from '../components/Badge';

export default function ProfilePage({ onOpenConfigModal }) {
  const { userProfile, updateProfile, logout, isAdmin, isRealFirebase } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        fullName,
        phone,
      });
      toast.success('Profil berhasil diperbarui.');
    } catch (e) {
      toast.error('Gagal menyimpan profil: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadImageFile(file, 'avatars');
      await updateProfile({ photoUrl: url });
      toast.success('Foto profil berhasil diubah.');
    } catch (e) {
      toast.error('Gagal mengunggah foto: ' + e.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const emergencyContacts = [
    { title: 'Pos Keamanan / Satpam GP4', phone: '0812-3456-7890', sub: 'Standby 24 Jam di Gerbang Utama' },
    { title: 'Ketua RT 04 (Bpk. Bambang)', phone: '0811-9876-5432', sub: 'Koordinasi Warga & Izin Lingkungan' },
    { title: 'Petugas Pengangkut Sampah', phone: '0857-1122-3344', sub: 'Jadwal: Selasa, Kamis, Sabtu Pagi' },
    { title: 'Bhabinkamtibmas Polsek', phone: '110', sub: 'Pelayanan Keamanan Kepolisian' },
    { title: 'Damkar & Penyelamatan', phone: '113', sub: 'Darurat Kebakaran' },
    { title: 'Ambulans / RS Terdekat', phone: '119', sub: 'Layanan Medis Darurat' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with upload badge */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-3xl shadow-md overflow-hidden border-4 border-white">
              {userProfile?.photoUrl ? (
                <img src={userProfile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                userProfile?.fullName?.charAt(0) || 'W'
              )}
            </div>
            <label 
              className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer transition-colors"
              title="Ubah Foto Profil"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          {/* User info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                {userProfile?.fullName || 'Warga'}
              </h1>
              <Badge variant={isAdmin ? 'purple' : 'primary'}>
                {isAdmin ? 'Pengurus RT/RW' : 'Warga Tetap'}
              </Badge>
              <Badge variant={userProfile?.status === 'approved' ? 'success' : 'warning'}>
                {userProfile?.status === 'approved' ? 'Terverifikasi' : 'Menunggu Validasi'}
              </Badge>
            </div>

            <p className="text-sm font-semibold text-emerald-700 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <Home className="w-4 h-4" />
              <span>Komplek Green Panorama 4 &bull; Blok {userProfile?.block || '-'} No. {userProfile?.houseNumber || '-'}</span>
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Email: {userProfile?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
          Perbarui Data Kontak & Profil
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor WhatsApp
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Blok Rumah (Terkunci)
              </label>
              <input
                type="text"
                disabled
                value={`Blok ${userProfile?.block || '-'}`}
                className="w-full px-3 py-2.5 text-sm bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nomor Rumah (Terkunci)
              </label>
              <input
                type="text"
                disabled
                value={`No. ${userProfile?.houseNumber || '-'}`}
                className="w-full px-3 py-2.5 text-sm bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">
              *Perubahan alamat rumah membutuhkan konfirmasi pengurus RT/RW.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Emergency Contacts of GP4 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-800">
              Nomor Darurat & Layanan Komplek GP4
            </h2>
          </div>
          <span className="text-xs text-slate-400">Simpan di ponsel</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {emergencyContacts.map((c, i) => (
            <div
              key={i}
              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">{c.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.sub}</p>
                <p className="text-xs font-mono font-bold text-emerald-700 mt-1">{c.phone}</p>
              </div>
              <a
                href={`tel:${c.phone.replace(/\D/g, '')}`}
                className="p-2 bg-emerald-100 text-emerald-800 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors"
                title="Panggil"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Account Logout / Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onOpenConfigModal}
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
        >
          Pengaturan Koneksi Firebase
        </button>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs sm:text-sm border border-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun (Logout)</span>
        </button>
      </div>
    </div>
  );
}
