import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Calendar, 
  User, 
  Trash2, 
  Edit3, 
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  subscribeAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} from '../firebase/services';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';

export default function AnnouncementsPage() {
  const { userProfile, isAdmin } = useAuth();
  const toast = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'Normal',
    status: 'published',
  });

  // Selected item modal for reading full announcement
  const [readingItem, setReadingItem] = useState(null);

  useEffect(() => {
    const unsub = subscribeAnnouncements((list) => {
      setAnnouncements(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      priority: 'Normal',
      status: 'published',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      priority: item.priority || 'Normal',
      status: item.status || 'published',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Yakin ingin menghapus pengumuman: "${title}"?`)) return;
    try {
      await deleteAnnouncement(id);
      toast.success('Pengumuman berhasil dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus: ' + e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.warning('Judul dan isi pengumuman wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          status: formData.status,
        });
        toast.success('Pengumuman berhasil diperbarui.');
      } else {
        await createAnnouncement({
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          status: formData.status,
          authorName: userProfile?.fullName || 'Pengurus GP4',
          authorId: userProfile?.uid || '',
        });
        toast.success('Pengumuman berhasil diterbitkan secara realtime!');
      }
      setIsModalOpen(false);
    } catch (e) {
      toast.error('Gagal menyimpan pengumuman: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search
  const filteredList = announcements.filter((item) => {
    // Non-admin can only see published
    if (!isAdmin && item.status === 'draft') return false;

    const matchesPriority = filterPriority === 'ALL' || item.priority === filterPriority;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

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

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-md mb-3">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Papan Informasi Warga</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Pengumuman Komplek Green Panorama 4
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
              Informasi resmi dari Pengurus RT, jadwal layanan lingkungan, dan pemberitahuan penting secara realtime.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-black/10 active:scale-95 transition-all self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengumuman</span>
            </button>
          )}
        </div>
      </div>

      {/* Controls & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari judul atau isi pengumuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          />
        </div>

        {/* Priority Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Darurat', 'Penting', 'Normal'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterPriority === p
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p === 'ALL' ? 'Semua Prioritas' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Tidak Ada Pengumuman"
          description={searchQuery ? 'Tidak ditemukan pengumuman yang sesuai dengan pencarian Anda.' : 'Belum ada pengumuman yang diterbitkan saat ini.'}
          actionText={isAdmin ? 'Buat Pengumuman Sekarang' : null}
          onAction={isAdmin ? handleOpenCreate : null}
        />
      ) : (
        <div className="grid gap-4">
          {filteredList.map((item) => {
            const isDarurat = item.priority === 'Darurat';
            const isPenting = item.priority === 'Penting';

            return (
              <article
                key={item.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-sm hover:shadow-md ${
                  isDarurat 
                    ? 'border-rose-300 ring-1 ring-rose-200/50 bg-rose-50/20' 
                    : isPenting 
                    ? 'border-amber-200 bg-amber-50/15' 
                    : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge
                      variant={isDarurat ? 'danger' : isPenting ? 'warning' : 'primary'}
                      size="sm"
                    >
                      {isDarurat && <AlertOctagon className="w-3 h-3" />}
                      {isPenting && <AlertTriangle className="w-3 h-3" />}
                      {!isDarurat && !isPenting && <Info className="w-3 h-3" />}
                      <span>{item.priority || 'Normal'}</span>
                    </Badge>

                    {isAdmin && item.status === 'draft' && (
                      <Badge variant="default" size="sm">
                        Draf (Belum Terbit)
                      </Badge>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Pengumuman"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h2 
                  onClick={() => setReadingItem(item)}
                  className="text-base sm:text-lg font-bold text-slate-800 hover:text-emerald-700 cursor-pointer transition-colors leading-snug"
                >
                  {item.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {item.content}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Diterbitkan oleh: <strong className="text-slate-700">{item.authorName || 'Pengurus GP4'}</strong></span>
                  </span>

                  <button
                    onClick={() => setReadingItem(item)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                  >
                    Baca Lengkap →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail Reader Modal */}
      {readingItem && (
        <Modal
          isOpen={Boolean(readingItem)}
          onClose={() => setReadingItem(null)}
          title="Detail Pengumuman"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  readingItem.priority === 'Darurat'
                    ? 'danger'
                    : readingItem.priority === 'Penting'
                    ? 'warning'
                    : 'primary'
                }
              >
                {readingItem.priority || 'Normal'}
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                {formatDate(readingItem.createdAt)}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              {readingItem.title}
            </h3>

            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
              {readingItem.content}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>Pengirim: <strong>{readingItem.authorName || 'Pengurus GP4'}</strong></span>
              <button
                onClick={() => setReadingItem(null)}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Modal (Admin) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Judul Pengumuman
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kerja Bakti Kebersihan Lingkungan"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Penting">Penting</option>
                <option value="Darurat">Darurat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Publikasi
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="published">Publikasikan Langsung</option>
                <option value="draft">Simpan Draf</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Isi Lengkap Pengumuman
            </label>
            <textarea
              required
              rows={6}
              placeholder="Tuliskan rincian pengumuman yang jelas dan mudah dipahami warga..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
