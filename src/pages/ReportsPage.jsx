import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCw, 
  MapPin, 
  Camera, 
  Trash2, 
  Upload, 
  User, 
  MessageSquare,
  ShieldCheck,
  Filter,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  subscribeReports, 
  createReport, 
  updateReportStatus, 
  deleteReport,
  uploadImageFile 
} from '../firebase/services';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { downloadCSV, generateReportsCSV } from '../utils/csvExport';

export default function ReportsPage() {
  const { userProfile, currentUser, isAdmin } = useAuth();
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Report Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Infrastruktur',
    description: '',
    location: '',
  });

  // Admin Response Modal
  const [selectedReportForAction, setSelectedReportForAction] = useState(null);
  const [actionStatus, setActionStatus] = useState('diproses');
  const [actionResponseNote, setActionResponseNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeReports(currentUser.uid || userProfile?.uid, isAdmin, (list) => {
      setReports(list);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser, userProfile, isAdmin]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      category: 'Infrastruktur',
      description: '',
      location: userProfile?.block ? `Blok ${userProfile.block} No. ${userProfile.houseNumber}` : '',
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setIsCreateModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.warning('Judul dan deskripsi laporan wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = '';
      if (selectedFile) {
        photoUrl = await uploadImageFile(selectedFile, 'reports');
      }

      await createReport({
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        photoUrl,
        userId: currentUser?.uid || userProfile?.uid,
        userName: userProfile?.fullName || 'Warga GP4',
        userHouse: userProfile?.block ? `Blok ${userProfile.block} No. ${userProfile.houseNumber}` : 'Green Panorama 4',
        userPhone: userProfile?.phone || '',
      });

      toast.success('Laporan pengaduan berhasil dikirim ke pengurus RT/RW.');
      setIsCreateModalOpen(false);
    } catch (e) {
      toast.error('Gagal mengirim laporan: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReportForAction) return;

    setUpdatingStatus(true);
    try {
      await updateReportStatus(
        selectedReportForAction.id,
        actionStatus,
        actionResponseNote,
        selectedReportForAction.userId
      );
      toast.success('Status laporan berhasil diperbarui.');
      setSelectedReportForAction(null);
    } catch (e) {
      toast.error('Gagal memperbarui status: ' + e.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Batalkan dan hapus laporan "${title}"?`)) return;
    try {
      await deleteReport(id);
      toast.success('Laporan dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus: ' + e.message);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'menunggu':
        return <Badge variant="warning" size="sm"><Clock className="w-3 h-3" /> Menunggu</Badge>;
      case 'diproses':
        return <Badge variant="info" size="sm"><RotateCw className="w-3 h-3 animate-spin" /> Diproses</Badge>;
      case 'selesai':
        return <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> Selesai</Badge>;
      case 'ditolak':
        return <Badge variant="danger" size="sm"><XCircle className="w-3 h-3" /> Ditolak</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const formatDate = (isoStringOrTimestamp) => {
    if (!isoStringOrTimestamp) return 'Hari ini';
    try {
      const date = isoStringOrTimestamp?.toDate ? isoStringOrTimestamp.toDate() : new Date(isoStringOrTimestamp);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Baru saja';
    }
  };

  const handleExportCSV = () => {
    try {
      const dataToExport = filteredReports.length > 0 ? filteredReports : reports;
      const csv = generateReportsCSV(dataToExport, userProfile?.fullName || 'Pengurus RT/RW');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCSV(`rekap-pengaduan-gp4-${dateStr}.csv`, csv);
      toast.success(`${dataToExport.length} data pengaduan berhasil diekspor ke CSV.`);
    } catch (e) {
      toast.error('Gagal mengekspor data pengaduan: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Layanan Aspirasi & Pengaduan Warga</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {isAdmin ? 'Semua Laporan Masuk Warga' : 'Laporan & Pengaduan Saya'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isAdmin 
              ? 'Pantau keluhan fasilitas, keamanan, dan kebersihan serta berikan tindak lanjut resmi.'
              : 'Sampaikan kendala fasilitas, keamanan, kebersihan komplek untuk segera ditangani pengurus.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          {isAdmin && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-xs"
              title="Unduh Rekap Laporan Pengaduan (.CSV)"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Laporan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'Semua Status' },
          { id: 'menunggu', label: 'Menunggu' },
          { id: 'diproses', label: 'Sedang Diproses' },
          { id: 'selesai', label: 'Selesai' },
          { id: 'ditolak', label: 'Ditolak' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredReports.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Belum Ada Laporan"
          description={isAdmin ? 'Tidak ada laporan warga pada filter ini.' : 'Anda belum pernah membuat laporan pengaduan.'}
          actionText="Buat Laporan Sekarang"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">{report.category || 'Umum'}</Badge>
                  {getStatusBadge(report.status)}
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDate(report.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setSelectedReportForAction(report);
                        setActionStatus(report.status || 'diproses');
                        setActionResponseNote(report.adminResponse || '');
                      }}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 transition-colors"
                    >
                      Tindak Lanjut Status
                    </button>
                  )}

                  {(!isAdmin && report.status === 'menunggu') && (
                    <button
                      onClick={() => handleDelete(report.id, report.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Batalkan Laporan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                  {report.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {report.description}
                </p>
              </div>

              {/* Photo Evidence if uploaded */}
              {report.photoUrl && (
                <div className="mt-2">
                  <a
                    href={report.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block max-w-xs rounded-xl overflow-hidden border border-slate-200 group relative"
                  >
                    <img
                      src={report.photoUrl}
                      alt="Bukti Laporan"
                      className="max-h-48 w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                      Klik untuk perbesar
                    </div>
                  </a>
                </div>
              )}

              {/* Metadata & Reporter info */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.userName}</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.location || report.userHouse}</span>
                  </span>
                </div>
              </div>

              {/* Admin official response callout */}
              {report.adminResponse && (
                <div className="mt-3 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Tanggapan Pengurus RT/RW:</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {report.adminResponse}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Report Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Laporan / Pengaduan Warga"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Judul Laporan
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Lampu Jalan Padam di Blok B"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Infrastruktur">Infrastruktur</option>
                <option value="Keamanan">Keamanan</option>
                <option value="Kebersihan">Kebersihan</option>
                <option value="Ketertiban">Ketertiban</option>
                <option value="Fasilitas Rusak">Fasilitas Rusak</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lokasi / No. Rumah
              </label>
              <input
                type="text"
                required
                placeholder="Blok C No. 04"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Rincian Masalah
            </label>
            <textarea
              rows={4}
              required
              placeholder="Jelaskan kendala secara mendalam agar mempermudah penanganan pengurus..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
            />
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Foto Bukti (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors border border-slate-200">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Unggah Foto Bukti</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {previewUrl && (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Action / Status Modal */}
      {selectedReportForAction && (
        <Modal
          isOpen={Boolean(selectedReportForAction)}
          onClose={() => setSelectedReportForAction(null)}
          title="Tindak Lanjut Laporan Warga"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAdminUpdateStatus} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">
              <p className="font-bold text-slate-800">{selectedReportForAction.title}</p>
              <p className="text-slate-500">Oleh: {selectedReportForAction.userName} ({selectedReportForAction.location})</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pilih Status Penanganan
              </label>
              <select
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
              >
                <option value="menunggu">Menunggu</option>
                <option value="diproses">Sedang Diproses Teknisi</option>
                <option value="selesai">Selesai Ditangani</option>
                <option value="ditolak">Ditolak / Di luar Wewenang</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Catatan / Pesan untuk Warga
              </label>
              <textarea
                rows={4}
                placeholder="Contoh: Petugas kebersihan sudah dikerahkan ke lokasi untuk penanganan..."
                value={actionResponseNote}
                onChange={(e) => setActionResponseNote(e.target.value)}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReportForAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updatingStatus}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {updatingStatus ? 'Menyimpan...' : 'Simpan Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
