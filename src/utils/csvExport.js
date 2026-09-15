/**
 * CSV Export Utility for Green Panorama 4 Admin Dashboard
 * Generates properly formatted, UTF-8 encoded CSV files compatible with Excel and Google Sheets
 */

// Helper to escape CSV values according to RFC 4180
export function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${str}"`;
}

// Helper to format date strings or Timestamps
export function formatDate(val) {
  if (!val) return '-';
  try {
    let d;
    if (typeof val === 'object' && typeof val.toDate === 'function') {
      d = val.toDate();
    } else {
      d = new Date(val);
    }
    if (isNaN(d.getTime())) return '-';

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min} WIB`;
  } catch (e) {
    return '-';
  }
}

// Download CSV helper with UTF-8 BOM
export function downloadCSV(filename, csvContent) {
  // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 properly without garbling characters
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate CSV for Residents Data and Demographics Statistics
 */
export function generateResidentsCSV(residents = [], adminName = 'Pengurus RT/RW') {
  const nowStr = formatDate(new Date());
  const total = residents.length;
  const approved = residents.filter(r => r.status === 'approved').length;
  const pending = residents.filter(r => r.status === 'pending').length;
  const rejected = residents.filter(r => r.status === 'rejected').length;
  const admins = residents.filter(r => r.role === 'admin').length;
  const regularResidents = residents.filter(r => r.role !== 'admin').length;

  // Block distribution
  const blockCounts = {};
  residents.forEach(r => {
    const b = (r.block || 'Lainnya').toUpperCase();
    blockCounts[b] = (blockCounts[b] || 0) + 1;
  });

  const sortedBlocks = Object.keys(blockCounts).sort();

  const lines = [];

  // Header & Metadata
  lines.push(escapeCSV('LAPORAN DATA & STATISTIK WARGA PERUMAHAN GREEN PANORAMA 4'));
  lines.push(`${escapeCSV('Tanggal Ekspor')},${escapeCSV(nowStr)}`);
  lines.push(`${escapeCSV('Diekspor Oleh')},${escapeCSV(adminName)}`);
  lines.push(`${escapeCSV('Perumahan')},${escapeCSV('Komplek Green Panorama 4')}`);
  lines.push('');

  // Section 1: Summary Statistics
  lines.push(escapeCSV('=== RINGKASAN STATISTIK KEWARGAAN ==='));
  lines.push(`${escapeCSV('Metrik / Indikator')},${escapeCSV('Jumlah')},${escapeCSV('Persentase (%)')}`);
  lines.push(`${escapeCSV('Total Warga Terdaftar')},${escapeCSV(total)},${escapeCSV('100%')}`);
  lines.push(`${escapeCSV('Warga Disetujui (Aktif)')},${escapeCSV(approved)},${escapeCSV(total ? ((approved / total) * 100).toFixed(1) + '%' : '0%')}`);
  lines.push(`${escapeCSV('Menunggu Verifikasi (Pending)')},${escapeCSV(pending)},${escapeCSV(total ? ((pending / total) * 100).toFixed(1) + '%' : '0%')}`);
  lines.push(`${escapeCSV('Pendaftaran Ditolak')},${escapeCSV(rejected)},${escapeCSV(total ? ((rejected / total) * 100).toFixed(1) + '%' : '0%')}`);
  lines.push(`${escapeCSV('Role Pengurus (Admin RT/RW)')},${escapeCSV(admins)},${escapeCSV(total ? ((admins / total) * 100).toFixed(1) + '%' : '0%')}`);
  lines.push(`${escapeCSV('Role Warga Biasa')},${escapeCSV(regularResidents)},${escapeCSV(total ? ((regularResidents / total) * 100).toFixed(1) + '%' : '0%')}`);
  lines.push('');

  // Section 2: Block Breakdown
  lines.push(escapeCSV('=== SEBARAN WARGA PER BLOK RUMAH ==='));
  lines.push(`${escapeCSV('Blok Rumah')},${escapeCSV('Jumlah Warga')},${escapeCSV('Proporsi')}`);
  sortedBlocks.forEach(blk => {
    const count = blockCounts[blk];
    const pct = total ? ((count / total) * 100).toFixed(1) + '%' : '0%';
    lines.push(`${escapeCSV('Blok ' + blk)},${escapeCSV(count)},${escapeCSV(pct)}`);
  });
  lines.push('');

  // Section 3: Detail Data Warga
  lines.push(escapeCSV('=== DAFTAR DETAIL DATA ANGGOTA WARGA ==='));
  lines.push([
    escapeCSV('No'),
    escapeCSV('Nama Lengkap'),
    escapeCSV('Blok'),
    escapeCSV('No. Rumah'),
    escapeCSV('Alamat Unit'),
    escapeCSV('Email'),
    escapeCSV('No. WhatsApp / HP'),
    escapeCSV('Status Verifikasi'),
    escapeCSV('Role Sistem'),
    escapeCSV('Tanggal Pendaftaran'),
    escapeCSV('Catatan Penolakan (Jika Ada)')
  ].join(','));

  residents.forEach((r, idx) => {
    const statusLabel = r.status === 'approved' 
      ? 'Disetujui' 
      : r.status === 'rejected' 
        ? 'Ditolak' 
        : 'Menunggu Verifikasi';
    
    const roleLabel = r.role === 'admin' ? 'Admin RT/RW' : 'Warga';
    const address = `Blok ${r.block || '-'} No. ${r.houseNumber || '-'}`;

    lines.push([
      escapeCSV(idx + 1),
      escapeCSV(r.fullName || '-'),
      escapeCSV(r.block || '-'),
      escapeCSV(r.houseNumber || '-'),
      escapeCSV(address),
      escapeCSV(r.email || '-'),
      escapeCSV(r.phone || '-'),
      escapeCSV(statusLabel),
      escapeCSV(roleLabel),
      escapeCSV(formatDate(r.createdAt)),
      escapeCSV(r.rejectReason || '-')
    ].join(','));
  });

  return lines.join('\r\n');
}

/**
 * Generate CSV for Reports (Pengaduan Warga) and Resolution Statistics
 */
export function generateReportsCSV(reports = [], adminName = 'Pengurus RT/RW') {
  const nowStr = formatDate(new Date());
  const total = reports.length;
  const resolved = reports.filter(r => r.status === 'selesai').length;
  const inProgress = reports.filter(r => r.status === 'diproses').length;
  const pending = reports.filter(r => r.status === 'menunggu').length;
  const rejected = reports.filter(r => r.status === 'ditolak').length;

  const resolutionRate = total ? ((resolved / total) * 100).toFixed(1) + '%' : '0%';

  // Category distribution
  const catCounts = {};
  const catResolved = {};
  reports.forEach(r => {
    const cat = r.category || 'Lainnya';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
    if (r.status === 'selesai') {
      catResolved[cat] = (catResolved[cat] || 0) + 1;
    }
  });

  const sortedCats = Object.keys(catCounts).sort();

  const lines = [];

  // Header & Metadata
  lines.push(escapeCSV('LAPORAN REKAPITULASI & STATISTIK PENGADUAN WARGA GREEN PANORAMA 4'));
  lines.push(`${escapeCSV('Tanggal Ekspor')},${escapeCSV(nowStr)}`);
  lines.push(`${escapeCSV('Diekspor Oleh')},${escapeCSV(adminName)}`);
  lines.push(`${escapeCSV('Perumahan')},${escapeCSV('Komplek Green Panorama 4')}`);
  lines.push('');

  // Section 1: Summary Statistics
  lines.push(escapeCSV('=== RINGKASAN STATISTIK PENGADUAN LINGKUNGAN ==='));
  lines.push(`${escapeCSV('Status Penanganan')},${escapeCSV('Jumlah Laporan')},${escapeCSV('Persentase (%)')}`);
  lines.push(`${escapeCSV('Total Pengaduan Masuk')},${escapeCSV(total)},${escapeCSV('100%')}`);
  lines.push(`${escapeCSV('Laporan Selesai Ditangani')},${escapeCSV(resolved)},${escapeCSV(total ? ((resolved / total) * 100).toFixed(1) + '%' : '0%')}`);
  lines.push(`${escapeCSV('Laporan Sedang Diproses')},${escapeCSV(inProgress)},${escapeCSV(total ? ((inProgress / total) * 100).toFixed(1) + '%' : '0%')}`);
  lines.push(`${escapeCSV('Laporan Menunggu Tindak Lanjut')},${escapeCSV(pending)},${escapeCSV(total ? ((pending / total) * 100).toFixed(1) + '%' : '0%')}`);
  lines.push(`${escapeCSV('Laporan Ditolak / Dibatalkan')},${escapeCSV(rejected)},${escapeCSV(total ? ((rejected / total) * 100).toFixed(1) + '%' : '0%')}`);
  lines.push(`${escapeCSV('Tingkat Penyelesaian (Resolution Rate)')},${escapeCSV(resolutionRate)},${escapeCSV('-')}`);
  lines.push('');

  // Section 2: Category Breakdown
  lines.push(escapeCSV('=== STATISTIK PENGADUAN BERDASARKAN KATEGORI ==='));
  lines.push(`${escapeCSV('Kategori Masalah')},${escapeCSV('Total Laporan')},${escapeCSV('Selesai Ditangani')},${escapeCSV('Tingkat Penyelesaian')}`);
  sortedCats.forEach(c => {
    const tot = catCounts[c] || 0;
    const res = catResolved[c] || 0;
    const rate = tot ? ((res / tot) * 100).toFixed(1) + '%' : '0%';
    lines.push(`${escapeCSV(c)},${escapeCSV(tot)},${escapeCSV(res)},${escapeCSV(rate)}`);
  });
  lines.push('');

  // Section 3: Detail Data Laporan
  lines.push(escapeCSV('=== DAFTAR DETAIL PENGADUAN & KELUHAN WARGA ==='));
  lines.push([
    escapeCSV('No'),
    escapeCSV('ID Laporan'),
    escapeCSV('Tanggal Laporan Masuk'),
    escapeCSV('Nama Pelapor'),
    escapeCSV('Unit / Rumah Pelapor'),
    escapeCSV('No. Kontak Pelapor'),
    escapeCSV('Judul Pengaduan'),
    escapeCSV('Kategori Masalah'),
    escapeCSV('Lokasi Spesifik'),
    escapeCSV('Status Penanganan'),
    escapeCSV('Tanggapan Resmi Pengurus RT'),
    escapeCSV('Deskripsi Lengkap'),
    escapeCSV('Terakhir Diperbarui')
  ].join(','));

  reports.forEach((r, idx) => {
    const statusLabel = r.status === 'selesai'
      ? 'Selesai'
      : r.status === 'diproses'
        ? 'Sedang Diproses'
        : r.status === 'ditolak'
          ? 'Ditolak'
          : 'Menunggu';

    lines.push([
      escapeCSV(idx + 1),
      escapeCSV(r.id || '-'),
      escapeCSV(formatDate(r.createdAt)),
      escapeCSV(r.userName || '-'),
      escapeCSV(r.userHouse || '-'),
      escapeCSV(r.userPhone || '-'),
      escapeCSV(r.title || '-'),
      escapeCSV(r.category || 'Umum'),
      escapeCSV(r.location || '-'),
      escapeCSV(statusLabel),
      escapeCSV(r.adminResponse || 'Belum ada tanggapan'),
      escapeCSV(r.description || '-'),
      escapeCSV(formatDate(r.updatedAt))
    ].join(','));
  });

  return lines.join('\r\n');
}

/**
 * Generate Comprehensive Executive Management Summary CSV
 * Combines resident metrics, pending actions, and report turnaround for RT/RW board meetings
 */
export function generateExecutiveSummaryCSV(stats = {}, residents = [], reports = [], adminName = 'Pengurus RT/RW') {
  const nowStr = formatDate(new Date());
  const lines = [];

  const totalRes = residents.length;
  const approvedRes = residents.filter(r => r.status === 'approved').length;
  const pendingRes = residents.filter(r => r.status === 'pending').length;
  const rejectedRes = residents.filter(r => r.status === 'rejected').length;

  const totalRep = reports.length;
  const resolvedRep = reports.filter(r => r.status === 'selesai').length;
  const inProgressRep = reports.filter(r => r.status === 'diproses').length;
  const pendingRep = reports.filter(r => r.status === 'menunggu').length;
  const resolutionRate = totalRep ? ((resolvedRep / totalRep) * 100).toFixed(1) + '%' : '0%';

  // Header & Metadata
  lines.push(escapeCSV('LAPORAN EKSEKUTIF MANAJEMEN PENGURUS RT/RW - GREEN PANORAMA 4'));
  lines.push(`${escapeCSV('Tanggal Laporan')},${escapeCSV(nowStr)}`);
  lines.push(`${escapeCSV('Diekspor Oleh')},${escapeCSV(adminName)}`);
  lines.push(`${escapeCSV('Klasifikasi Dokumen')},${escapeCSV('Laporan Manajemen Bulanan / Rapat Pengurus')}`);
  lines.push('');

  // 1. Executive KPIs
  lines.push(escapeCSV('=== 1. INDIKATOR UTAMA KINERJA (KEY PERFORMANCE INDICATORS) ==='));
  lines.push(`${escapeCSV('Parameter')},${escapeCSV('Nilai Realtime')},${escapeCSV('Status Operasional')}`);
  lines.push(`${escapeCSV('Total Warga Terdaftar')},${escapeCSV(totalRes + ' Jiwa/Keluarga')},${escapeCSV('Tercatat di Portal')}`);
  lines.push(`${escapeCSV('Warga Terverifikasi Aktif')},${escapeCSV(approvedRes + ' Warga')},${escapeCSV(totalRes ? ((approvedRes / totalRes) * 100).toFixed(1) + '% Terverifikasi' : '0%')}`);
  lines.push(`${escapeCSV('Pendaftar Butuh Verifikasi Segera')},${escapeCSV(pendingRes + ' Permohonan')},${escapeCSV(pendingRes > 0 ? 'Perlu Ditindaklanjuti Pengurus' : 'Tidak Ada Tunggakan')}`);
  lines.push(`${escapeCSV('Total Pengaduan Masuk')},${escapeCSV(totalRep + ' Laporan')},${escapeCSV('Akumulasi')}`);
  lines.push(`${escapeCSV('Pengaduan Tuntas Ditangani')},${escapeCSV(resolvedRep + ' Laporan')},${escapeCSV('Tingkat Penyelesaian: ' + resolutionRate)}`);
  lines.push(`${escapeCSV('Pengaduan Masih Pending/Menunggu')},${escapeCSV(pendingRep + ' Laporan')},${escapeCSV(pendingRep > 0 ? 'Butuh Penanganan' : 'Bersih')}`);
  lines.push('');

  // 2. Demografi per Blok
  const blockCounts = {};
  residents.forEach(r => {
    const b = (r.block || 'Lainnya').toUpperCase();
    blockCounts[b] = (blockCounts[b] || 0) + 1;
  });
  lines.push(escapeCSV('=== 2. SEBARAN HUNIAN BERDASARKAN BLOK ==='));
  lines.push(`${escapeCSV('Blok Perumahan')},${escapeCSV('Jumlah Warga Terdata')},${escapeCSV('Porsi dari Total')}`);
  Object.keys(blockCounts).sort().forEach(blk => {
    const count = blockCounts[blk];
    const pct = totalRes ? ((count / totalRes) * 100).toFixed(1) + '%' : '0%';
    lines.push(`${escapeCSV('Blok ' + blk)},${escapeCSV(count)},${escapeCSV(pct)}`);
  });
  lines.push('');

  // 3. Masalah Utama Terbanyak
  const catCounts = {};
  reports.forEach(r => {
    const cat = r.category || 'Umum';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  lines.push(escapeCSV('=== 3. KATEGORI KELUHAN LINGKUNGAN PALING SERING DILAPORKAN ==='));
  lines.push(`${escapeCSV('Kategori Masalah')},${escapeCSV('Jumlah Laporan')},${escapeCSV('Persentase')}`);
  Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]).forEach(c => {
    const count = catCounts[c];
    const pct = totalRep ? ((count / totalRep) * 100).toFixed(1) + '%' : '0%';
    lines.push(`${escapeCSV(c)},${escapeCSV(count)},${escapeCSV(pct)}`);
  });
  lines.push('');

  // 4. Action Items (Pending issues requiring attention)
  const unresolvedReports = reports.filter(r => r.status === 'menunggu' || r.status === 'diproses');
  lines.push(escapeCSV('=== 4. TINDAK LANJUT: PENGADUAN YANG SEDANG / BELUM DISELESAIKAN ==='));
  lines.push([
    escapeCSV('No'),
    escapeCSV('ID'),
    escapeCSV('Tanggal'),
    escapeCSV('Pelapor'),
    escapeCSV('Rumah'),
    escapeCSV('Judul Keluhan'),
    escapeCSV('Kategori'),
    escapeCSV('Status'),
    escapeCSV('Catatan Pengurus')
  ].join(','));

  if (unresolvedReports.length === 0) {
    lines.push(escapeCSV('Tidak ada laporan pengaduan yang tertunda. Semua laporan telah diselesaikan!'));
  } else {
    unresolvedReports.forEach((r, idx) => {
      lines.push([
        escapeCSV(idx + 1),
        escapeCSV(r.id || '-'),
        escapeCSV(formatDate(r.createdAt)),
        escapeCSV(r.userName || '-'),
        escapeCSV(r.userHouse || '-'),
        escapeCSV(r.title || '-'),
        escapeCSV(r.category || '-'),
        escapeCSV(r.status === 'diproses' ? 'Sedang Diproses' : 'Menunggu'),
        escapeCSV(r.adminResponse || 'Belum ditanggapi')
      ].join(','));
    });
  }

  return lines.join('\r\n');
}
