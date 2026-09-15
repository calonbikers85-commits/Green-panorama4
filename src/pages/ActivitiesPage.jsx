import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  MapPin, 
  Clock, 
  Image as ImageIcon, 
  Trash2, 
  Edit3, 
  Upload, 
  Calendar,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  subscribeActivities, 
  createActivity, 
  updateActivity, 
  deleteActivity,
  uploadImageFile 
} from '../firebase/services';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';

export default function ActivitiesPage() {
  const { userProfile, isAdmin } = useAuth();
  const toast = useToast();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    posterUrl: '',
  });

  useEffect(() => {
    const unsub = subscribeActivities((list) => {
      setActivities(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      time: '08:00 WIB',
      location: 'Clubhouse Green Panorama 4',
      description: '',
      posterUrl: '',
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act) => {
    setEditingId(act.id);
    setFormData({
      name: act.name,
      date: act.date,
      time: act.time,
      location: act.location,
      description: act.description,
      posterUrl: act.posterUrl || '',
    });
    setSelectedFile(null);
    setPreviewUrl(act.posterUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus agenda kegiatan: "${name}"?`)) return;
    try {
      await deleteActivity(id);
      toast.success('Kegiatan berhasil dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus: ' + e.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date || !formData.location.trim()) {
      toast.warning('Nama kegiatan, tanggal, dan lokasi wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      let finalPosterUrl = formData.posterUrl;
      if (selectedFile) {
        finalPosterUrl = await uploadImageFile(selectedFile, 'activities');
      }

      if (editingId) {
        await updateActivity(editingId, {
          name: formData.name,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          description: formData.description,
          posterUrl: finalPosterUrl,
        });
        toast.success('Agenda kegiatan berhasil diperbarui.');
      } else {
        await createActivity({
          name: formData.name,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          description: formData.description,
          posterUrl: finalPosterUrl,
          authorId: userProfile?.uid || '',
        });
        toast.success('Kegiatan baru berhasil dijadwalkan!');
      }
      setIsModalOpen(false);
    } catch (e) {
      toast.error('Gagal menyimpan kegiatan: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Agenda & Kegiatan Warga</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Jadwal Kegiatan Komunitas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ikuti gotong royong, senam sehat, rapat warga, dan acara silaturahmi komplek.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kegiatan</span>
          </button>
        )}
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum Ada Kegiatan Terjadwal"
          description="Saat ini belum ada agenda kegiatan yang dijadwalkan oleh pengurus."
          actionText={isAdmin ? 'Jadwalkan Kegiatan Baru' : null}
          onAction={isAdmin ? handleOpenCreate : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activities.map((act) => (
            <div
              key={act.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              {/* Optional Poster Header */}
              {act.posterUrl ? (
                <div className="w-full h-44 bg-slate-100 relative overflow-hidden">
                  <img
                    src={act.posterUrl}
                    alt={act.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[11px] font-bold bg-emerald-600/90 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                      {formatEventDate(act.date)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-24 bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between text-white relative">
                  <div>
                    <span className="text-[11px] font-bold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                      {formatEventDate(act.date)}
                    </span>
                  </div>
                  <Calendar className="w-8 h-8 opacity-20" />
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                      {act.name}
                    </h2>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(act)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(act.id, act.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {act.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Pukul: <strong>{act.time}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Lokasi: <strong>{act.location}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit Activity */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Kegiatan'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Kegiatan
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Gotong Royong Saluran Air Blok C"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Pelaksanaan
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Waktu / Jam
              </label>
              <input
                type="text"
                required
                placeholder="08:00 WIB"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Lokasi / Tempat
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Lapangan Serbaguna GP4"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Deskripsi Kegiatan
            </label>
            <textarea
              rows={4}
              required
              placeholder="Jelaskan detail kegiatan, peralatan yang perlu dibawa, dll..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
            />
          </div>

          {/* Poster Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Poster / Foto Kegiatan (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors border border-slate-200">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Pilih Foto Poster</span>
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
              {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Jadwalkan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
