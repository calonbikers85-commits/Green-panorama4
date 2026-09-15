import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Clock, 
  Camera, 
  Trash2, 
  Edit3, 
  Upload, 
  Check, 
  Info 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  subscribeFacilities, 
  createFacility, 
  updateFacility, 
  deleteFacility,
  uploadImageFile 
} from '../firebase/services';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';

export default function FacilitiesPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    operationalHours: '',
    photoUrl: '',
  });

  useEffect(() => {
    const unsub = subscribeFacilities((list) => {
      setFacilities(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      location: '',
      operationalHours: '06.00 - 22.00 WIB',
      photoUrl: '',
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fac) => {
    setEditingId(fac.id);
    setFormData({
      name: fac.name,
      description: fac.description,
      location: fac.location,
      operationalHours: fac.operationalHours || '',
      photoUrl: fac.photoUrl || '',
    });
    setSelectedFile(null);
    setPreviewUrl(fac.photoUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus fasilitas "${name}"?`)) return;
    try {
      await deleteFacility(id);
      toast.success('Fasilitas berhasil dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus: ' + e.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.warning('Nama fasilitas dan lokasi wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      let finalPhotoUrl = formData.photoUrl;
      if (selectedFile) {
        finalPhotoUrl = await uploadImageFile(selectedFile, 'facilities');
      }

      if (editingId) {
        await updateFacility(editingId, {
          name: formData.name,
          description: formData.description,
          location: formData.location,
          operationalHours: formData.operationalHours,
          photoUrl: finalPhotoUrl,
        });
        toast.success('Fasilitas berhasil diperbarui.');
      } else {
        await createFacility({
          name: formData.name,
          description: formData.description,
          location: formData.location,
          operationalHours: formData.operationalHours,
          photoUrl: finalPhotoUrl,
        });
        toast.success('Fasilitas baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
    } catch (e) {
      toast.error('Gagal menyimpan fasilitas: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Fasilitas Bersama</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Fasilitas Komplek Green Panorama 4
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Informasi sarana olahraga, ibadah, taman terbuka, dan tata tertib penggunaan fasilitas.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Fasilitas</span>
          </button>
        )}
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : facilities.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum Ada Fasilitas Terdata"
          description="Belum ada data fasilitas yang ditambahkan oleh pengurus."
          actionText={isAdmin ? 'Tambah Fasilitas Pertama' : null}
          onAction={isAdmin ? handleOpenCreate : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo or Graphic Header */}
                {fac.photoUrl ? (
                  <div className="w-full h-44 bg-slate-100 overflow-hidden relative">
                    <img src={fac.photoUrl} alt={fac.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-36 bg-gradient-to-tr from-emerald-800 to-teal-600 p-4 flex items-center justify-center text-white relative">
                    <Building2 className="w-12 h-12 opacity-30" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-base font-bold text-slate-800 leading-snug">
                      {fac.name}
                    </h2>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(fac)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(fac.id, fac.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {fac.description}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-700">{fac.location}</span>
                </div>
                {fac.operationalHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Jam Operasional: <strong>{fac.operationalHours}</strong></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Fasilitas Komplek' : 'Tambah Fasilitas Komplek'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Fasilitas
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kolam Renang Warga"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lokasi di Komplek
              </label>
              <input
                type="text"
                required
                placeholder="Area Clubhouse / Blok D"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jam Operasional
              </label>
              <input
                type="text"
                placeholder="06.00 - 21.00 WIB"
                value={formData.operationalHours}
                onChange={(e) => setFormData({ ...formData, operationalHours: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Deskripsi & Tata Tertib Fasilitas
            </label>
            <textarea
              rows={4}
              required
              placeholder="Jelaskan fasilitas dan aturan penggunaannya..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Foto Fasilitas (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors border border-slate-200">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Pilih Foto</span>
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
              {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Fasilitas'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
