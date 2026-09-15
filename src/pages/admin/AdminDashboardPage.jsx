import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Megaphone, 
  Building2, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RotateCw,
  FileSpreadsheet,
  Download,
  FileDown,
  Filter,
  FileText,
  Check,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  getAdminStatistics, 
  subscribeReports, 
  subscribeAnnouncements, 
  subscribeResidents 
} from '../../firebase/services';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { StatsSkeleton } from '../../components/LoadingSkeleton';
import { 
  downloadCSV, 
  generateResidentsCSV, 
  generateReportsCSV, 
  generateExecutiveSummaryCSV 
} from '../../utils/csvExport';

export default function AdminDashboardPage({ onNavigate }) {
  const { userProfile } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState({
    totalResidents: 0,
    pendingResidents: 0,
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    totalAnnouncements: 0,
    totalActivities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [allResidents, setAllResidents] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);

  // CSV Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState('residents'); // 'residents' | 'reports' | 'executive'
  const [residentStatusFilter, setResidentStatusFilter] = useState('ALL');
  const [residentBlockFilter, setResidentBlockFilter] = useState('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const s = await getAdminStatistics();
        setStats(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();

    // Subscribe to recent reports & announcements for live admin overview
    const unsubReports = subscribeReports('', true, (list) => {
      setAllReports(list);
      setRecentReports(list.slice(0, 4));
      // update stats dynamically
      setStats(prev => ({
        ...prev,
        totalReports: list.length,
        resolvedReports: list.filter(r => r.status === 'selesai').length,
        pendingReports: list.filter(r => r.status === 'menunggu').length,
      }));
    });

    const unsubAnnounce = subscribeAnnouncements((list) => {
      setRecentAnnouncements(list.slice(0, 3));
      setStats(prev => ({ ...prev, totalAnnouncements: list.length }));
    });

    const unsubResidents = subscribeResidents((list) => {
      setAllResidents(list);
      setStats(prev => ({
        ...prev,
        totalResidents: list.length,
        pendingResidents: list.filter(r => r.status === 'pending').length,
      }));
    });

    return () => {
      unsubReports();
      unsubAnnounce();
      unsubResidents();
    };
  }, []);

  // Quick direct exports
  const handleDirectExportResidents = () => {
    try {
      const csv = generateResidentsCSV(allResidents, userProfile?.fullName || 'Pengurus RT/RW');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCSV(`statistik-warga-green-panorama-4-${dateStr}.csv`, csv);
      toast.success(`${allResidents.length} data warga & statistik berhasil diekspor ke CSV.`);
    } catch (err) {
      toast.error('Gagal mengekspor data warga: ' + err.message);
    }
  };

  const handleDirectExportReports = () => {
    try {
      const csv = generateReportsCSV(allReports, userProfile?.fullName || 'Pengurus RT/RW');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCSV(`statistik-pengaduan-green-panorama-4-${dateStr}.csv`, csv);
      toast.success(`${allReports.length} data pengaduan & statistik berhasil diekspor ke CSV.`);
    } catch (err) {
      toast.error('Gagal mengekspor data pengaduan: ' + err.message);
    }
  };

  const handleDirectExportExecutive = () => {
    try {
      const csv = generateExecutiveSummaryCSV(stats, allResidents, allReports, userProfile?.fullName || 'Pengurus RT/RW');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCSV(`laporan-manajemen-eksekutif-gp4-${dateStr}.csv`, csv);
      toast.success('Laporan Ringkasan Eksekutif manajemen RT/RW berhasil diekspor ke CSV.');
    } catch (err) {
      toast.error('Gagal mengekspor laporan eksekutif: ' + err.message);
    }
  };

  // Filtered export handler from modal
  const handlePerformCustomExport = () => {
    setExporting(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);

      if (exportType === 'residents') {
        const filtered = allResidents.filter(r => {
          const matchStatus = residentStatusFilter === 'ALL' || r.status === residentStatusFilter;
          const matchBlock = residentBlockFilter === 'ALL' || (r.block || '').toUpperCase() === residentBlockFilter.toUpperCase();
          return matchStatus && matchBlock;
        });

        const csv = generateResidentsCSV(filtered, userProfile?.fullName || 'Pengurus RT/RW');
        downloadCSV(`laporan-warga-gp4-kustom-${dateStr}.csv`, csv);
        toast.success(`${filtered.length} data warga berhasil diekspor ke CSV.`);
      } else if (exportType === 'reports') {
        const filtered = allReports.filter(r => {
          const matchStatus = reportStatusFilter === 'ALL' || r.status === reportStatusFilter;
          const matchCategory = reportCategoryFilter === 'ALL' || r.category === reportCategoryFilter;
          return matchStatus && matchCategory;
        });

        const csv = generateReportsCSV(filtered, userProfile?.fullName || 'Pengurus RT/RW');
        downloadCSV(`laporan-pengaduan-gp4-kustom-${dateStr}.csv`, csv);
        toast.success(`${filtered.length} data laporan berhasil diekspor ke CSV.`);
      } else {
        const csv = generateExecutiveSummaryCSV(stats, allResidents, allReports, userProfile?.fullName || 'Pengurus RT/RW');
        downloadCSV(`laporan-manajemen-eksekutif-gp4-${dateStr}.csv`, csv);
        toast.success('Laporan Eksekutif Manajemen berhasil diekspor ke CSV.');
      }

      setIsExportModalOpen(false);
    } catch (err) {
      toast.error('Gagal mengekspor: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Extract unique blocks & categories for modal filter
  const availableBlocks = Array.from(
    new Set(allResidents.map(r => (r.block || '').toUpperCase()).filter(Boolean))
  ).sort();

  const availableCategories = Array.from(
    new Set(allReports.map(r => r.category || 'Umum').filter(Boolean))
  ).sort();

  // Calculate filtered preview counts in modal
  const previewResidentCount = allResidents.filter(r => {
    const matchStatus = residentStatusFilter === 'ALL' || r.status === residentStatusFilter;
    const matchBlock = residentBlockFilter === 'ALL' || (r.block || '').toUpperCase() === residentBlockFilter.toUpperCase();
    return matchStatus && matchBlock;
  }).length;

  const previewReportCount = allReports.filter(r => {
    const matchStatus = reportStatusFilter === 'ALL' || r.status === reportStatusFilter;
    const matchCategory = reportCategoryFilter === 'ALL' || r.category === reportCategoryFilter;
    return matchStatus && matchCategory;
  }).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pusat Kendali Pengurus RT/RW</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Selamat Datang, {userProfile?.fullName || 'Pengurus'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Ringkasan realtime status warga, verifikasi pendaftaran akun, serta penanganan laporan pengaduan lingkungan komplek Green Panorama 4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            {stats.pendingResidents > 0 && (
              <button
                onClick={() => onNavigate('residents')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>{stats.pendingResidents} Butuh Verifikasi!</span>
              </button>
            )}

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs sm:text-sm border border-white/20 backdrop-blur-xs active:scale-95 transition-all"
              title="Ekspor Statistik ke File CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Required Metrics from User Prompt */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Warga */}
          <div 
            onClick={() => onNavigate('residents')}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Terdaftar
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {stats.totalResidents}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Total Warga Komplek</p>
          </div>

          {/* Menunggu Persetujuan */}
          <div 
            onClick={() => onNavigate('residents')}
            className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-amber-50/20"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                Pending
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
              {stats.pendingResidents}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">Menunggu Persetujuan</p>
          </div>

          {/* Total Laporan */}
          <div 
            onClick={() => onNavigate('reports')}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                Pengaduan
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {stats.totalReports}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Total Laporan Warga</p>
          </div>

          {/* Laporan Selesai */}
          <div 
            onClick={() => onNavigate('reports')}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                Tuntas
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-700 tracking-tight">
              {stats.resolvedReports}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Laporan Selesai Ditangani</p>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('residents')}
          className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-3xl border border-emerald-200/80 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Validasi Warga Baru</h3>
            <ArrowRight className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Tinjau data KTP/nomor rumah pendaftar, setujui atau tolak akses portal.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('announcements')}
          className="p-5 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-3xl border border-slate-200/80 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Buat Pengumuman Baru</h3>
            <ArrowRight className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Kirimkan kabar darurat, kerja bakti, atau pengumuman penting ke seluruh warga.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('reports')}
          className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-3xl border border-amber-200/80 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Tangani Pengaduan Warga</h3>
            <ArrowRight className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Beri tanggapan resmi dan ubah status laporan jadi diproses atau selesai.
          </p>
        </div>
      </div>

      {/* CSV Export & Management Reporting Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-1 border border-emerald-200">
                <BarChart3 className="w-3 h-3" />
                <span>Format Laporan Manajemen RT/RW</span>
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Ekspor Data & Statistik CSV
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                Unduh rekapitulasi data kependudukan dan statistik pengaduan lingkungan ke dalam format spreadsheet CSV (kompatibel penuh dengan Microsoft Excel, WPS, dan Google Sheets) untuk keperluan rapat pengurus RT/RW dan arsip resmi.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setExportType('residents');
              setIsExportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-center"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Kustomisasi & Filter Ekspor</span>
          </button>
        </div>

        {/* 3 Dedicated Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Resident Stats & Demographics CSV */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 rounded-2xl p-5 border border-emerald-200/70 flex flex-col justify-between hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  Data Warga
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Statistik & Data Warga (.CSV)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Rekap demografi kependudukan, distribusi warga per blok, status verifikasi (pending/approved), kontak WhatsApp, dan email.
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
                <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                  Total: <strong className="text-slate-800">{allResidents.length}</strong>
                </span>
                <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                  Aktif: <strong className="text-emerald-700">{allResidents.filter(r => r.status === 'approved').length}</strong>
                </span>
                <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                  Pending: <strong className="text-amber-700">{allResidents.filter(r => r.status === 'pending').length}</strong>
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-emerald-100/80 flex items-center gap-2">
              <button
                onClick={handleDirectExportResidents}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh CSV Warga</span>
              </button>
              <button
                onClick={() => {
                  setExportType('residents');
                  setIsExportModalOpen(true);
                }}
                className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs"
                title="Filter Data Warga"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Report Stats & Resolution CSV */}
          <div className="bg-gradient-to-br from-sky-50/70 via-white to-blue-50/40 rounded-2xl p-5 border border-sky-200/70 flex flex-col justify-between hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-md">
                  Pengaduan
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Statistik & Pengaduan Warga (.CSV)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tingkat penyelesaian (resolution rate), sebaran keluhan per kategori (keamanan, fasilitas, kebersihan), dan riwayat pengaduan.
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
                <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                  Total: <strong className="text-slate-800">{allReports.length}</strong>
                </span>
                <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                  Selesai: <strong className="text-teal-700">{allReports.filter(r => r.status === 'selesai').length}</strong>
                </span>
                <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                  Diproses: <strong className="text-sky-700">{allReports.filter(r => r.status === 'diproses').length}</strong>
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-sky-100/80 flex items-center gap-2">
              <button
                onClick={handleDirectExportReports}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh CSV Pengaduan</span>
              </button>
              <button
                onClick={() => {
                  setExportType('reports');
                  setIsExportModalOpen(true);
                }}
                className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs"
                title="Filter Data Pengaduan"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Executive Summary Management CSV */}
          <div className="bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/40 rounded-2xl p-5 border border-purple-200/70 flex flex-col justify-between hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-md">
                  Rapat RT/RW
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Laporan Ringkasan Eksekutif (.CSV)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Laporan terpadu satu file mencakup Key Performance Indicators (KPI), rekap demografi, rasio penyelesaian laporan, dan isu mendesak.
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
                <span className="bg-white px-2 py-1 rounded-lg border border-purple-200 text-purple-900 font-bold">
                  Tingkat Tuntas: {allReports.length ? ((allReports.filter(r => r.status === 'selesai').length / allReports.length) * 100).toFixed(0) + '%' : '100%'}
                </span>
                <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                  Siap Cetak / Excel
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-purple-100/80 flex items-center gap-2">
              <button
                onClick={handleDirectExportExecutive}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Unduh Ringkasan Eksekutif</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Reports & Recent Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Pengaduan Warga Terbaru</span>
            </h2>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="space-y-2.5">
            {recentReports.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada laporan masuk.</p>
            ) : (
              recentReports.map((r) => (
                <div 
                  key={r.id}
                  onClick={() => onNavigate('reports')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{r.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {r.userName} &bull; {r.location || r.userHouse}
                    </p>
                  </div>
                  <Badge 
                    variant={r.status === 'selesai' ? 'success' : r.status === 'diproses' ? 'info' : 'warning'} 
                    size="sm"
                  >
                    {r.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600" />
              <span>Pengumuman Aktif</span>
            </h2>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Kelola →
            </button>
          </div>

          <div className="space-y-2.5">
            {recentAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada pengumuman.</p>
            ) : (
              recentAnnouncements.map((a) => (
                <div 
                  key={a.id}
                  onClick={() => onNavigate('announcements')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{a.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{a.content}</p>
                  </div>
                  <Badge 
                    variant={a.priority === 'Darurat' ? 'danger' : a.priority === 'Penting' ? 'warning' : 'primary'} 
                    size="sm"
                  >
                    {a.priority || 'Normal'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CSV Custom Export & Filter Modal */}
      {isExportModalOpen && (
        <Modal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Kustomisasi Ekspor Laporan CSV"
          maxWidth="max-w-lg"
        >
          <div className="space-y-5">
            {/* Export Type Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Jenis Laporan
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setExportType('residents')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    exportType === 'residents'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Data Warga
                </button>
                <button
                  type="button"
                  onClick={() => setExportType('reports')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    exportType === 'reports'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Pengaduan Warga
                </button>
                <button
                  type="button"
                  onClick={() => setExportType('executive')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    exportType === 'executive'
                      ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Ringkasan Eksekutif
                </button>
              </div>
            </div>

            {/* Resident Filters */}
            {exportType === 'residents' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Filter Data Kependudukan</span>
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Status Verifikasi Akun:
                  </label>
                  <select
                    value={residentStatusFilter}
                    onChange={(e) => setResidentStatusFilter(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    <option value="ALL">Semua Status (Aktif, Pending, Ditolak)</option>
                    <option value="approved">Hanya Disetujui (Warga Aktif)</option>
                    <option value="pending">Hanya Pending (Menunggu Verifikasi)</option>
                    <option value="rejected">Hanya Ditolak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Filter Berdasarkan Blok Rumah:
                  </label>
                  <select
                    value={residentBlockFilter}
                    onChange={(e) => setResidentBlockFilter(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    <option value="ALL">Semua Blok (Seluruh Komplek)</option>
                    {availableBlocks.map((b) => (
                      <option key={b} value={b}>Blok {b}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200">
                  <span>Hasil Filter:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {previewResidentCount} dari {allResidents.length} Warga
                  </span>
                </div>
              </div>
            )}

            {/* Reports Filters */}
            {exportType === 'reports' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-sky-700" />
                  <span>Filter Data Pengaduan Lingkungan</span>
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Status Tindak Lanjut:
                  </label>
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  >
                    <option value="ALL">Semua Status Laporan</option>
                    <option value="selesai">Hanya Laporan Selesai</option>
                    <option value="diproses">Hanya Sedang Diproses</option>
                    <option value="menunggu">Hanya Menunggu Tindak Lanjut</option>
                    <option value="ditolak">Hanya Ditolak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Kategori Masalah:
                  </label>
                  <select
                    value={reportCategoryFilter}
                    onChange={(e) => setReportCategoryFilter(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  >
                    <option value="ALL">Semua Kategori Masalah</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200">
                  <span>Hasil Filter:</span>
                  <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    {previewReportCount} dari {allReports.length} Laporan
                  </span>
                </div>
              </div>
            )}

            {/* Executive Summary Explanation */}
            {exportType === 'executive' && (
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 text-xs text-purple-900 space-y-2">
                <p className="font-bold text-purple-950 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-700" />
                  <span>Format Laporan Gabungan untuk Pengurus RT/RW</span>
                </p>
                <p className="text-purple-800 leading-relaxed text-[11px]">
                  File CSV ini menyatukan indikator utama kepengurusan komplek:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-purple-900">
                  <li>Key Performance Indicators (Tingkat hunian & rasio tuntas laporan)</li>
                  <li>Demografi dan sebaran warga per blok perumahan</li>
                  <li>Analisis frekuensi kategori keluhan lingkungan</li>
                  <li>Daftar pengaduan yang masih pending dan butuh perhatian segera</li>
                </ul>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={handlePerformCustomExport}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? 'Mengekspor...' : 'Unduh File CSV (.csv)'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
