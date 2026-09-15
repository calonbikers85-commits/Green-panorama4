import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Check, 
  X, 
  Trash2, 
  Shield, 
  User, 
  Phone, 
  Home, 
  Mail, 
  Clock, 
  AlertCircle,
  MessageCircle,
  ShieldAlert,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  subscribeResidents, 
  approveResident, 
  rejectResident, 
  deleteResident, 
  updateUserRole 
} from '../../firebase/services';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import { downloadCSV, generateResidentsCSV } from '../../utils/csvExport';

export default function AdminResidentsPage() {
  const { userProfile: adminProfile } = useAuth();
  const toast = useToast();

  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetResident, setTargetResident] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const unsub = subscribeResidents((list) => {
      setResidents(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (resident) => {
    try {
      await approveResident(resident.id || resident.uid);
      toast.success(`Akun ${resident.fullName} telah disetujui.`);
    } catch (e) {
      toast.error('Gagal menyetujui akun: ' + e.message);
    }
  };

  const handleOpenReject = (resident) => {
    setTargetResident(resident);
    setRejectReason('Data nomor rumah atau kepemilikan belum terverifikasi oleh pengurus.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!targetResident) return;

    setProcessing(true);
    try {
      await rejectResident(targetResident.id || targetResident.uid, rejectReason);
      toast.warning(`Pendaftaran ${targetResident.fullName} ditolak dengan alasan.`);
      setRejectModalOpen(false);
      setTargetResident(null);
    } catch (e) {
      toast.error('Gagal menolak akun: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (resident) => {
    if (resident.id === adminProfile?.uid) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    if (!window.confirm(`Hapus permanen akun warga "${resident.fullName}" (${resident.email})?`)) return;

    try {
      await deleteResident(resident.id || resident.uid);
      toast.success('Akun warga telah dihapus dari sistem.');
    } catch (e) {
      toast.error('Gagal menghapus warga: ' + e.message);
    }
  };

  const handleToggleRole = async (resident) => {
    if (resident.id === adminProfile?.uid) {
      toast.error('Anda tidak dapat mencabut role admin Anda sendiri.');
      return;
    }

    const newRole = resident.role === 'admin' ? 'resident' : 'admin';
    const confirmMsg = newRole === 'admin'
      ? `Jadikan "${resident.fullName}" sebagai Administrator RT/RW? Akun ini akan memiliki wewenang penuh.`
      : `Kembalikan role "${resident.fullName}" menjadi Warga biasa?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await updateUserRole(resident.id || resident.uid, newRole);
      toast.success(`Role warga berhasil diubah menjadi ${newRole}.`);
    } catch (e) {
      toast.error('Gagal mengubah role: ' + e.message);
    }
  };

  const handleExportCSV = () => {
    try {
      const dataToExport = filteredResidents.length > 0 ? filteredResidents : residents;
      const csv = generateResidentsCSV(dataToExport, adminProfile?.fullName || 'Pengurus RT/RW');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCSV(`data-warga-gp4-${dateStr}.csv`, csv);
      toast.success(`${dataToExport.length} data warga berhasil diekspor ke format CSV.`);
    } catch (e) {
      toast.error('Gagal mengekspor data warga: ' + e.message);
    }
  };

  // Filter
  const filteredResidents = residents.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      (r.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.houseNumber || '').includes(searchQuery) ||
      (r.block || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manajemen Anggota Warga</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Validasi & Kelola Warga GP4
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Setujui warga baru, kelola role administrator RT/RW, dan validasi kepemilikan unit rumah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl shadow-xs transition-colors"
            title="Unduh Data Warga Format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
          <span className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
            Pending: {residents.filter(r => r.status === 'pending').length}
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
            Approved: {residents.filter(r => r.status === 'approved').length}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama, email, blok, atau nomor rumah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'pending', label: 'Pending (Butuh Verifikasi)' },
            { id: 'approved', label: 'Disetujui' },
            { id: 'rejected', label: 'Ditolak' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Grid of Residents */}
      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredResidents.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Tidak Ada Data Warga"
          description="Tidak ditemukan data pendaftar pada filter ini."
        />
      ) : (
        <div className="space-y-3">
          {filteredResidents.map((r) => {
            const isSelf = r.id === adminProfile?.uid;
            const waClean = (r.phone || '').replace(/^0/, '62').replace(/\D/g, '');

            return (
              <div
                key={r.id || r.uid}
                className={`bg-white rounded-3xl p-5 border transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  r.status === 'pending'
                    ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-base shrink-0 shadow-inner overflow-hidden">
                    {r.photoUrl ? (
                      <img src={r.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      r.fullName?.charAt(0) || 'W'
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800 truncate">
                        {r.fullName}
                      </h2>
                      {isSelf && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                          Akun Anda
                        </span>
                      )}
                      <Badge variant={r.role === 'admin' ? 'purple' : 'default'} size="sm">
                        {r.role === 'admin' ? 'Admin RT' : 'Warga'}
                      </Badge>
                      <Badge 
                        variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'} 
                        size="sm"
                      >
                        {r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
                      </Badge>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-emerald-800">
                        <Home className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Blok {r.block} No. {r.houseNumber}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[180px]">{r.email}</span>
                      </span>
                      {r.phone && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.phone}</span>
                        </span>
                      )}
                    </div>

                    {r.rejectReason && (
                      <p className="text-[11px] text-rose-600 mt-1 italic">
                        Alasan penolakan: {r.rejectReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Button Group */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* WhatsApp contact */}
                  {waClean && (
                    <a
                      href={`https://wa.me/${waClean}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors"
                      title="Chat WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}

                  {/* Approve button if pending or rejected */}
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(r)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui</span>
                    </button>
                  )}

                  {/* Reject button if pending */}
                  {r.status === 'pending' && (
                    <button
                      onClick={() => handleOpenReject(r)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>
                  )}

                  {/* Toggle Role (Admin / Resident) */}
                  {!isSelf && (
                    <button
                      onClick={() => handleToggleRole(r)}
                      className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl border border-slate-200 transition-colors"
                      title={r.role === 'admin' ? "Ubah jadi Warga Biasa" : "Jadikan Admin RT"}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete resident */}
                  {!isSelf && (
                    <button
                      onClick={() => handleDelete(r)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                      title="Hapus Akun Warga"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Tolak Pendaftaran Warga"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <p className="font-bold">Warga: {targetResident?.fullName}</p>
              <p>Alamat: Blok {targetResident?.block} No. {targetResident?.houseNumber}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Alasan Penolakan (Dapat dibaca oleh warga)
              </label>
              <textarea
                rows={4}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
              >
                {processing ? 'Menolak...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
