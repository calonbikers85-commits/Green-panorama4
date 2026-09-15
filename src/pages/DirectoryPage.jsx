import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  MessageCircle, 
  Home, 
  Phone, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeResidents } from '../firebase/services';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';

export default function DirectoryPage() {
  const { isAdmin } = useAuth();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [blockFilter, setBlockFilter] = useState('ALL');

  useEffect(() => {
    const unsub = subscribeResidents((list) => {
      // Only approved residents in public directory unless admin
      setResidents(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const approvedResidents = residents.filter(r => r.status === 'approved');

  const filtered = approvedResidents.filter((r) => {
    const matchBlock = blockFilter === 'ALL' || r.block === blockFilter;
    const matchSearch =
      (r.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.houseNumber || '').includes(searchQuery) ||
      (r.block || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchBlock && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Katalog Warga Terverifikasi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Direktori Tetangga Komplek GP4
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar kontak dan alamat rumah warga Green Panorama 4 yang telah disetujui pengurus.
          </p>
        </div>

        <div className="text-xs bg-slate-50 px-3.5 py-2 rounded-xl border text-slate-600 font-semibold self-start sm:self-center">
          Total: <strong className="text-emerald-700">{approvedResidents.length}</strong> Rumah Terdata
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama warga, blok, atau nomor rumah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map((b) => (
            <button
              key={b}
              onClick={() => setBlockFilter(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                blockFilter === b
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {b === 'ALL' ? 'Semua Blok' : `Blok ${b}`}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak Ada Data Warga"
          description="Tidak ditemukan data tetangga yang sesuai dengan filter atau pencarian Anda."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((warga) => {
            const waClean = (warga.phone || '').replace(/^0/, '62').replace(/\D/g, '');
            const waLink = waClean ? `https://wa.me/${waClean}` : null;

            return (
              <div
                key={warga.id || warga.uid}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                      {warga.fullName?.charAt(0) || 'W'}
                    </div>
                    <Badge variant={warga.role === 'admin' ? 'purple' : 'primary'} size="sm">
                      {warga.role === 'admin' ? 'Pengurus RT' : 'Warga Tetap'}
                    </Badge>
                  </div>

                  <h2 className="text-base font-bold text-slate-800 leading-snug">
                    {warga.fullName}
                  </h2>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-700">
                        Blok {warga.block} No. {warga.houseNumber}
                      </span>
                    </div>
                    {warga.phone && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{warga.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat WhatsApp</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No WhatsApp tidak ada</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
