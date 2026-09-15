import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  addDoc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, isRealFirebase } from './config';

// -------------------------------------------------------------
// LOCAL DEMO / FALLBACK STORE (Active if Firebase is unconfigured)
// -------------------------------------------------------------
const LOCAL_STORAGE_KEY = 'gp4_local_db_v1';

function getLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return getInitialMockData();
}

function saveLocalData(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

function getInitialMockData() {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'admin-default',
        fullName: 'Bapak Ahmad Subagja',
        email: 'admin@greenpanorama.com',
        phone: '081234567890',
        block: 'A',
        houseNumber: '01',
        role: 'admin',
        status: 'approved',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'resident-demo-1',
        fullName: 'Dr. Budi Santoso',
        email: 'budi@warga.com',
        phone: '081298765432',
        block: 'B',
        houseNumber: '12',
        role: 'resident',
        status: 'approved',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'resident-demo-pending',
        fullName: 'Rian Pratama',
        email: 'rian@warga.com',
        phone: '081377889900',
        block: 'C',
        houseNumber: '05',
        role: 'resident',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }
    ],
    announcements: [
      {
        id: 'ann-1',
        title: 'Jadwal Fogging Nyamuk DBD Komplek',
        content: 'Diberitahukan kepada seluruh warga Komplek Green Panorama 4 bahwa akan dilaksanakan penyemprotan fogging DBD pada hari Sabtu pukul 08.00 WIB. Mohon menutup makanan dan ventilasi saat proses berlangsung.',
        priority: 'Penting',
        status: 'published',
        authorName: 'Pengurus RT 04',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'ann-2',
        title: 'Kerja Bakti Lingkungan & Penghijauan Taman',
        content: 'Mari bersama-sama menjaga keasrian lingkungan komplek kita. Kerja bakti serentak pembersihan saluran air dan penanaman bibit pohon di area taman bermain.',
        priority: 'Normal',
        status: 'published',
        authorName: 'Seksi Lingkungan',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      }
    ],
    activities: [
      {
        id: 'act-1',
        name: 'Senam Sehat & Posyandu Lansia',
        date: '2026-09-20',
        time: '06:30 WIB',
        location: 'Clubhouse Green Panorama 4',
        description: 'Senam aerobik bersama instruktur profesional dilanjutkan dengan pemeriksaan tekanan darah dan gula darah gratis bagi warga.',
        posterUrl: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'act-2',
        name: 'Rapat Koordinasi Keamanan & Ronda Malam',
        date: '2026-09-26',
        time: '20:00 WIB',
        location: 'Balai Warga Blok B',
        description: 'Pembahasan peningkatan portal keamanan otomatis dan penyesuaian jadwal petugas security shift malam.',
        posterUrl: '',
        createdAt: now,
        updatedAt: now,
      }
    ],
    reports: [
      {
        id: 'rep-1',
        title: 'Lampu Penerangan Jalan Blok B Mati',
        category: 'Infrastruktur',
        description: 'Lampu PJU nomor 04 di depan rumah B-08 padam sejak 2 hari yang lalu, jalan menjadi gelap di malam hari.',
        location: 'Depan Rumah Blok B-08',
        photoUrl: '',
        status: 'diproses',
        userId: 'resident-demo-1',
        userName: 'Dr. Budi Santoso',
        userHouse: 'Blok B No. 12',
        adminResponse: 'Petugas PLN / teknisi komplek dijadwalkan mengganti bohlam LED sore ini.',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        updatedAt: now,
      }
    ],
    forum_posts: [
      {
        id: 'post-1',
        content: 'Selamat sore bapak ibu warga GP4. Ada yang punya rekomendasi tukang kebun langganan yang rapi dan terpercaya untuk area taman depan? Terima kasih banyak.',
        imageUrl: '',
        authorId: 'resident-demo-1',
        authorName: 'Dr. Budi Santoso',
        authorHouse: 'Blok B-12',
        likes: [],
        likesCount: 2,
        commentCount: 1,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        updatedAt: now,
      }
    ],
    comments: [
      {
        id: 'comm-1',
        postId: 'post-1',
        content: 'Ada Pak Budi, Pak Joko biasa bantu saya di Blok A. Nanti saya kirimkan kontak WA-nya ya.',
        authorId: 'admin-default',
        authorName: 'Bapak Ahmad Subagja',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      }
    ],
    facilities: [
      {
        id: 'fac-1',
        name: 'Clubhouse & Lapangan Serbaguna',
        description: 'Fasilitas olahraga dan ruang pertemuan warga. Tersedia lapangan badminton, tenis meja, dan ruang serbaguna ber-AC.',
        location: 'Area Utama Gate Depan',
        operationalHours: '06.00 - 22.00 WIB',
        photoUrl: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'fac-2',
        name: 'Taman Bermain Anak & Jogging Track',
        description: 'Taman terbuka hijau dengan ayunan, perosotan aman untuk balita, dikelilingi jogging track rindang.',
        location: 'Samping Blok C',
        operationalHours: '24 Jam',
        photoUrl: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'fac-3',
        name: 'Masjid Al-Ikhlas Green Panorama 4',
        description: 'Tempat ibadah berjamaah, pengajian rutin warga tiap malam Jumat, dan pembinaan TPA untuk anak-anak.',
        location: 'Blok A Ujung',
        operationalHours: '24 Jam',
        photoUrl: '',
        createdAt: now,
        updatedAt: now,
      }
    ],
    notifications: [
      {
        id: 'notif-1',
        userId: 'resident-demo-1',
        title: 'Laporan Anda Diproses',
        message: 'Laporan "Lampu Penerangan Jalan Blok B Mati" sedang ditindaklanjuti oleh teknisi komplek.',
        type: 'report',
        read: false,
        createdAt: now,
      }
    ],
    settings: {
      complexName: 'Green Panorama 4',
      address: 'Jl. Panorama Asri No. 4, Komplek Green Panorama 4',
      emergencyContact: '0811-2233-4455 (Pos Security 24 Jam)',
      rtLeader: 'Bapak Ahmad Subagja (0812-3456-7890)',
    }
  };
}

// Event emitter for local listeners
const localListeners = new Set();
function notifyLocalListeners() {
  localListeners.forEach(fn => fn());
}

// -------------------------------------------------------------
// AUTHENTICATION SERVICES
// -------------------------------------------------------------

export async function registerResident({ email, password, fullName, block, houseNumber, phone }) {
  if (isRealFirebase && auth && db) {
    // 1. Create in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if this is the very first user in users collection
    const usersSnap = await getDocs(collection(db, 'users'));
    const isFirstUser = usersSnap.empty;

    // 2. Save user profile document in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      fullName: fullName.trim(),
      block: block.trim().toUpperCase(),
      houseNumber: houseNumber.trim(),
      phone: phone.trim(),
      role: isFirstUser ? 'admin' : 'resident',
      status: isFirstUser ? 'approved' : 'pending',
      photoUrl: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, userData);

    // If pending, notify admins
    if (!isFirstUser) {
      await createNotification({
        userId: 'admin',
        title: 'Warga Baru Mendaftar',
        message: `${fullName} (Blok ${block} No. ${houseNumber}) telah mendaftar dan menunggu persetujuan.`,
        type: 'approval',
      });
    }

    return { user, userProfile: userData };
  } else {
    // Local Fallback simulation
    const data = getLocalData();
    const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Email ini sudah terdaftar di sistem.');
    }

    const newId = 'user-' + Date.now();
    const isFirstUser = data.users.length === 0;
    const now = new Date().toISOString();

    const newUser = {
      id: newId,
      uid: newId,
      email,
      fullName: fullName.trim(),
      block: block.trim().toUpperCase(),
      houseNumber: houseNumber.trim(),
      phone: phone.trim(),
      role: isFirstUser ? 'admin' : 'resident',
      status: isFirstUser ? 'approved' : 'pending',
      photoUrl: '',
      createdAt: now,
      updatedAt: now,
    };

    data.users.push(newUser);
    saveLocalData(data);
    localStorage.setItem('gp4_current_user_id', newId);
    notifyLocalListeners();

    return { user: { uid: newId, email }, userProfile: newUser };
  }
}

export async function loginUser(email, password) {
  if (isRealFirebase && auth && db) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDocSnap = await getDoc(doc(db, 'users', user.uid));
    let userProfile = userDocSnap.exists() ? userDocSnap.data() : null;
    return { user, userProfile };
  } else {
    // Local store check
    const data = getLocalData();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Email tidak terdaftar atau password salah.');
    }
    localStorage.setItem('gp4_current_user_id', user.id || user.uid);
    notifyLocalListeners();
    return { user: { uid: user.id || user.uid, email: user.email }, userProfile: user };
  }
}

export async function logoutUser() {
  if (isRealFirebase && auth) {
    await signOut(auth);
  }
  localStorage.removeItem('gp4_current_user_id');
  notifyLocalListeners();
}

export async function resetPassword(email) {
  if (isRealFirebase && auth) {
    await sendPasswordResetEmail(auth, email);
  }
  return true;
}

// -------------------------------------------------------------
// USER SERVICES
// -------------------------------------------------------------

export function subscribeUserProfile(uid, callback) {
  if (isRealFirebase && db) {
    const userDocRef = doc(db, 'users', uid);
    return onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      } else {
        callback(null);
      }
    }, (err) => {
      console.error('Error fetching user profile:', err);
    });
  } else {
    const check = () => {
      const data = getLocalData();
      const u = data.users.find(x => (x.uid === uid || x.id === uid));
      callback(u || null);
    };
    check();
    localListeners.add(check);
    return () => localListeners.delete(check);
  }
}

export function subscribeAllUsers(callback) {
  if (isRealFirebase && db) {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(users);
    });
  } else {
    const check = () => {
      const data = getLocalData();
      callback(data.users || []);
    };
    check();
    localListeners.add(check);
    return () => localListeners.delete(check);
  }
}

export const subscribeResidents = subscribeAllUsers;

export async function updateUserProfile(uid, { fullName, phone, photoUrl }) {
  if (isRealFirebase && db) {
    const userDocRef = doc(db, 'users', uid);
    // Note: strictly excludes role, status, email from being overwritten by user
    const updatePayload = {
      updatedAt: serverTimestamp(),
    };
    if (fullName !== undefined) updatePayload.fullName = fullName.trim();
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (photoUrl !== undefined) updatePayload.photoUrl = photoUrl;

    await updateDoc(userDocRef, updatePayload);
  } else {
    const data = getLocalData();
    const idx = data.users.findIndex(u => (u.uid === uid || u.id === uid));
    if (idx !== -1) {
      data.users[idx] = {
        ...data.users[idx],
        fullName: fullName || data.users[idx].fullName,
        phone: phone || data.users[idx].phone,
        photoUrl: photoUrl !== undefined ? photoUrl : data.users[idx].photoUrl,
        updatedAt: new Date().toISOString()
      };
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function approveResident(uid) {
  if (isRealFirebase && db) {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      status: 'approved',
      updatedAt: serverTimestamp(),
    });
    // Send notification to the user
    await createNotification({
      userId: uid,
      title: 'Akun Anda Telah Disetujui!',
      message: 'Selamat datang di Green Panorama 4. Akun warga Anda kini aktif dan dapat mengakses seluruh fitur portal.',
      type: 'approval',
    });
  } else {
    const data = getLocalData();
    const idx = data.users.findIndex(u => (u.uid === uid || u.id === uid));
    if (idx !== -1) {
      data.users[idx].status = 'approved';
      data.users[idx].updatedAt = new Date().toISOString();
      data.notifications.unshift({
        id: 'notif-' + Date.now(),
        userId: uid,
        title: 'Akun Anda Telah Disetujui!',
        message: 'Selamat datang di Green Panorama 4. Akun Anda telah disetujui pengurus komplek.',
        type: 'approval',
        read: false,
        createdAt: new Date().toISOString()
      });
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function rejectResident(uid, reason = '') {
  if (isRealFirebase && db) {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      status: 'rejected',
      rejectReason: reason,
      updatedAt: serverTimestamp(),
    });
    await createNotification({
      userId: uid,
      title: 'Status Registrasi Akun',
      message: `Registrasi belum dapat disetujui: ${reason || 'Silakan hubungi pengurus RT untuk konfirmasi alamat rumah.'}`,
      type: 'approval',
    });
  } else {
    const data = getLocalData();
    const idx = data.users.findIndex(u => (u.uid === uid || u.id === uid));
    if (idx !== -1) {
      data.users[idx].status = 'rejected';
      data.users[idx].rejectReason = reason;
      data.users[idx].updatedAt = new Date().toISOString();
      data.notifications.unshift({
        id: 'notif-' + Date.now(),
        userId: uid,
        title: 'Status Registrasi Akun',
        message: `Registrasi ditolak: ${reason || 'Silakan hubungi pengurus RT.'}`,
        type: 'approval',
        read: false,
        createdAt: new Date().toISOString()
      });
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function updateUserRole(uid, role) {
  if (isRealFirebase && db) {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      role,
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = getLocalData();
    const idx = data.users.findIndex(u => (u.uid === uid || u.id === uid));
    if (idx !== -1) {
      data.users[idx].role = role;
      data.users[idx].updatedAt = new Date().toISOString();
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function deleteResident(uid) {
  if (isRealFirebase && db) {
    await deleteDoc(doc(db, 'users', uid));
  } else {
    const data = getLocalData();
    data.users = data.users.filter(u => u.uid !== uid && u.id !== uid);
    saveLocalData(data);
    notifyLocalListeners();
  }
}

export async function getAdminStatistics() {
  if (isRealFirebase && db) {
    try {
      const [usersSnap, reportsSnap, annSnap, actSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'reports')),
        getDocs(collection(db, 'announcements')),
        getDocs(collection(db, 'activities')),
      ]);

      const users = usersSnap.docs.map(d => d.data());
      const reports = reportsSnap.docs.map(d => d.data());

      return {
        totalResidents: users.length,
        pendingResidents: users.filter(u => u.status === 'pending').length,
        totalReports: reports.length,
        resolvedReports: reports.filter(r => r.status === 'selesai').length,
        pendingReports: reports.filter(r => r.status === 'menunggu').length,
        totalAnnouncements: annSnap.size,
        totalActivities: actSnap.size,
      };
    } catch (e) {
      console.warn('Error fetching admin statistics from Firebase:', e);
    }
  }

  const data = getLocalData();
  return {
    totalResidents: data.users.length,
    pendingResidents: data.users.filter(u => u.status === 'pending').length,
    totalReports: data.reports.length,
    resolvedReports: data.reports.filter(r => r.status === 'selesai').length,
    pendingReports: data.reports.filter(r => r.status === 'menunggu').length,
    totalAnnouncements: data.announcements.length,
    totalActivities: data.activities.length,
  };
}

// -------------------------------------------------------------
// ANNOUNCEMENTS (Pengumuman Realtime)
// -------------------------------------------------------------

export function subscribeAnnouncements(callback) {
  if (isRealFirebase && db) {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    }, (err) => {
      console.warn('Announcements realtime listener note:', err);
    });
  } else {
    const check = () => {
      const data = getLocalData();
      callback(data.announcements || []);
    };
    check();
    localListeners.add(check);
    return () => localListeners.delete(check);
  }
}

export async function createAnnouncement({ title, content, priority = 'Normal', status = 'published', authorName, authorId }) {
  if (isRealFirebase && db) {
    const docRef = await addDoc(collection(db, 'announcements'), {
      title: title.trim(),
      content: content.trim(),
      priority, // 'Normal', 'Penting', 'Darurat'
      status, // 'published', 'draft'
      authorName: authorName || 'Pengurus GP4',
      authorId: authorId || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (status === 'published') {
      await createNotification({
        userId: 'all',
        title: `Pengumuman Baru: ${title}`,
        message: content.length > 80 ? content.substring(0, 80) + '...' : content,
        type: 'announcement',
      });
    }
    return docRef.id;
  } else {
    const data = getLocalData();
    const newDoc = {
      id: 'ann-' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      priority,
      status,
      authorName: authorName || 'Pengurus GP4',
      authorId: authorId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.announcements.unshift(newDoc);
    if (status === 'published') {
      data.notifications.unshift({
        id: 'notif-' + Date.now(),
        userId: 'all',
        title: `Pengumuman Baru: ${title}`,
        message: content.substring(0, 80),
        type: 'announcement',
        read: false,
        createdAt: new Date().toISOString()
      });
    }
    saveLocalData(data);
    notifyLocalListeners();
    return newDoc.id;
  }
}

export async function updateAnnouncement(id, updateData) {
  if (isRealFirebase && db) {
    await updateDoc(doc(db, 'announcements', id), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = getLocalData();
    const idx = data.announcements.findIndex(a => a.id === id);
    if (idx !== -1) {
      data.announcements[idx] = {
        ...data.announcements[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function deleteAnnouncement(id) {
  if (isRealFirebase && db) {
    await deleteDoc(doc(db, 'announcements', id));
  } else {
    const data = getLocalData();
    data.announcements = data.announcements.filter(a => a.id !== id);
    saveLocalData(data);
    notifyLocalListeners();
  }
}

// -------------------------------------------------------------
// ACTIVITIES (Kegiatan)
// -------------------------------------------------------------

export function subscribeActivities(callback) {
  if (isRealFirebase && db) {
    const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    });
  } else {
    const check = () => {
      const data = getLocalData();
      callback(data.activities || []);
    };
    check();
    localListeners.add(check);
    return () => localListeners.delete(check);
  }
}

export async function createActivity({ name, date, time, location, description, posterUrl, authorId }) {
  if (isRealFirebase && db) {
    const docRef = await addDoc(collection(db, 'activities'), {
      name: name.trim(),
      date,
      time,
      location: location.trim(),
      description: description.trim(),
      posterUrl: posterUrl || '',
      authorId: authorId || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      userId: 'all',
      title: `Kegiatan Mendatang: ${name}`,
      message: `Akan diadakan pada ${date} pukul ${time} di ${location}.`,
      type: 'activity',
    });

    return docRef.id;
  } else {
    const data = getLocalData();
    const newDoc = {
      id: 'act-' + Date.now(),
      name: name.trim(),
      date,
      time,
      location: location.trim(),
      description: description.trim(),
      posterUrl: posterUrl || '',
      authorId: authorId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.activities.unshift(newDoc);
    data.notifications.unshift({
      id: 'notif-' + Date.now(),
      userId: 'all',
      title: `Kegiatan Baru: ${name}`,
      message: `Pada ${date} pukul ${time} di ${location}.`,
      type: 'activity',
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveLocalData(data);
    notifyLocalListeners();
    return newDoc.id;
  }
}

export async function updateActivity(id, updateData) {
  if (isRealFirebase && db) {
    await updateDoc(doc(db, 'activities', id), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = getLocalData();
    const idx = data.activities.findIndex(a => a.id === id);
    if (idx !== -1) {
      data.activities[idx] = {
        ...data.activities[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function deleteActivity(id) {
  if (isRealFirebase && db) {
    await deleteDoc(doc(db, 'activities', id));
  } else {
    const data = getLocalData();
    data.activities = data.activities.filter(a => a.id !== id);
    saveLocalData(data);
    notifyLocalListeners();
  }
}

// -------------------------------------------------------------
// REPORTS (Laporan / Pengaduan)
// -------------------------------------------------------------

export function subscribeReports(userId, isAdmin, callback) {
  if (isRealFirebase && db) {
    let q;
    if (isAdmin) {
      q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    } else {
      q = query(
        collection(db, 'reports'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    }, (err) => {
      console.warn('Reports realtime listener note:', err);
    });
  } else {
    const check = () => {
      const data = getLocalData();
      if (isAdmin) {
        callback(data.reports || []);
      } else {
        const filtered = (data.reports || []).filter(r => r.userId === userId);
        callback(filtered);
      }
    };
    check();
    localListeners.add(check);
    return () => localListeners.delete(check);
  }
}

export async function createReport({ title, category, description, photoUrl, location, userId, userName, userHouse, userPhone }) {
  if (isRealFirebase && db) {
    const docRef = await addDoc(collection(db, 'reports'), {
      title: title.trim(),
      category: category || 'Umum',
      description: description.trim(),
      photoUrl: photoUrl || '',
      location: location.trim(),
      userId,
      userName,
      userHouse,
      userPhone: userPhone || '',
      status: 'menunggu', // menunggu | diproses | selesai | ditolak
      adminResponse: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      userId: 'admin',
      title: `Laporan Baru Masuk`,
      message: `${userName} (${userHouse}) melaporkan: "${title}"`,
      type: 'report',
    });

    return docRef.id;
  } else {
    const data = getLocalData();
    const newDoc = {
      id: 'rep-' + Date.now(),
      title: title.trim(),
      category: category || 'Umum',
      description: description.trim(),
      photoUrl: photoUrl || '',
      location: location.trim(),
      userId,
      userName,
      userHouse,
      userPhone: userPhone || '',
      status: 'menunggu',
      adminResponse: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.reports.unshift(newDoc);
    data.notifications.unshift({
      id: 'notif-' + Date.now(),
      userId: 'admin',
      title: `Laporan Baru Masuk`,
      message: `${userName} (${userHouse}) melaporkan: "${title}"`,
      type: 'report',
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveLocalData(data);
    notifyLocalListeners();
    return newDoc.id;
  }
}

export async function updateReportStatus(reportId, newStatus, adminResponse = '', targetUserId = '') {
  if (isRealFirebase && db) {
    await updateDoc(doc(db, 'reports', reportId), {
      status: newStatus,
      adminResponse: adminResponse.trim(),
      updatedAt: serverTimestamp(),
    });

    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        title: `Status Laporan Diperbarui`,
        message: `Laporan Anda kini berstatus "${newStatus.toUpperCase()}". ${adminResponse ? 'Catatan: ' + adminResponse : ''}`,
        type: 'report',
      });
    }
  } else {
    const data = getLocalData();
    const idx = data.reports.findIndex(r => r.id === reportId);
    if (idx !== -1) {
      data.reports[idx].status = newStatus;
      data.reports[idx].adminResponse = adminResponse;
      data.reports[idx].updatedAt = new Date().toISOString();
      const reportUserId = targetUserId || data.reports[idx].userId;
      data.notifications.unshift({
        id: 'notif-' + Date.now(),
        userId: reportUserId,
        title: `Status Laporan Diperbarui`,
        message: `Laporan "${data.reports[idx].title}" kini berstatus "${newStatus.toUpperCase()}".`,
        type: 'report',
        read: false,
        createdAt: new Date().toISOString(),
      });
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function deleteReport(reportId) {
  if (isRealFirebase && db) {
    await deleteDoc(doc(db, 'reports', reportId));
  } else {
    const data = getLocalData();
    data.reports = data.reports.filter(r => r.id !== reportId);
    saveLocalData(data);
    notifyLocalListeners();
  }
}

// -------------------------------------------------------------
// FORUM POSTS & COMMENTS
// -------------------------------------------------------------

export function subscribeForumPosts(callback) {
  if (isRealFirebase && db) {
    const q = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    });
  } else {
    const check = () => {
      const data = getLocalData();
      callback(data.forum_posts || []);
    };
    check();
    localListeners.add(check);
    return () => localListeners.delete(check);
  }
}

export async function createForumPost({ content, imageUrl = '', authorId, authorName, authorHouse, authorPhoto = '' }) {
  if (isRealFirebase && db) {
    const docRef = await addDoc(collection(db, 'forum_posts'), {
      content: content.trim(),
      imageUrl,
      authorId,
      authorName,
      authorHouse,
      authorPhoto,
      likes: [],
      likesCount: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } else {
    const data = getLocalData();
    const newDoc = {
      id: 'post-' + Date.now(),
      content: content.trim(),
      imageUrl,
      authorId,
      authorName,
      authorHouse,
      authorPhoto,
      likes: [],
      likesCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.forum_posts.unshift(newDoc);
    saveLocalData(data);
    notifyLocalListeners();
    return newDoc.id;
  }
}

export async function toggleLikePost(postId, userId) {
  if (isRealFirebase && db) {
    const postRef = doc(db, 'forum_posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const postData = postSnap.data();
    const likes = postData.likes || [];
    const hasLiked = likes.includes(userId);

    if (hasLiked) {
      await updateDoc(postRef, {
        likes: arrayRemove(userId),
        likesCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(userId),
        likesCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }
  } else {
    const data = getLocalData();
    const post = data.forum_posts.find(p => p.id === postId);
    if (post) {
      if (!post.likes) post.likes = [];
      const idx = post.likes.indexOf(userId);
      if (idx !== -1) {
        post.likes.splice(idx, 1);
        post.likesCount = Math.max(0, (post.likesCount || 1) - 1);
      } else {
        post.likes.push(userId);
        post.likesCount = (post.likesCount || 0) + 1;
      }
      post.updatedAt = new Date().toISOString();
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function deleteForumPost(postId) {
  if (isRealFirebase && db) {
    await deleteDoc(doc(db, 'forum_posts', postId));
    // Optionally delete related comments
    const commentsSnap = await getDocs(query(collection(db, 'comments'), where('postId', '==', postId)));
    for (const d of commentsSnap.docs) {
      await deleteDoc(doc(db, 'comments', d.id));
    }
  } else {
    const data = getLocalData();
    data.forum_posts = data.forum_posts.filter(p => p.id !== postId);
    data.comments = data.comments.filter(c => c.postId !== postId);
    saveLocalData(data);
    notifyLocalListeners();
  }
}

export function subscribeComments(postId, callback) {
  if (isRealFirebase && db) {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    });
  } else {
    const check = () => {
      const data = getLocalData();
      const list = (data.comments || []).filter(c => c.postId === postId);
      callback(list);
    };
    check();
    localListeners.add(check);
    return () => localListeners.delete(check);
  }
}

export async function addComment({ postId, content, authorId, authorName, authorPhoto = '' }) {
  if (isRealFirebase && db) {
    const docRef = await addDoc(collection(db, 'comments'), {
      postId,
      content: content.trim(),
      authorId,
      authorName,
      authorPhoto,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'forum_posts', postId), {
      commentCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } else {
    const data = getLocalData();
    const newDoc = {
      id: 'comm-' + Date.now(),
      postId,
      content: content.trim(),
      authorId,
      authorName,
      authorPhoto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.comments.push(newDoc);
    const post = data.forum_posts.find(p => p.id === postId);
    if (post) post.commentCount = (post.commentCount || 0) + 1;
    saveLocalData(data);
    notifyLocalListeners();
    return newDoc.id;
  }
}

export async function deleteComment(commentId, postId) {
  if (isRealFirebase && db) {
    await deleteDoc(doc(db, 'comments', commentId));
    await updateDoc(doc(db, 'forum_posts', postId), {
      commentCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = getLocalData();
    data.comments = data.comments.filter(c => c.id !== commentId);
    const post = data.forum_posts.find(p => p.id === postId);
    if (post && post.commentCount > 0) post.commentCount -= 1;
    saveLocalData(data);
    notifyLocalListeners();
  }
}

// -------------------------------------------------------------
// FACILITIES (Fasilitas)
// -------------------------------------------------------------

export function subscribeFacilities(callback) {
  if (isRealFirebase && db) {
    const q = query(collection(db, 'facilities'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    });
  } else {
    const check = () => {
      const data = getLocalData();
      callback(data.facilities || []);
    };
    check();
    localListeners.add(check);
    return () => localListeners.delete(check);
  }
}

export async function createFacility({ name, description, location, photoUrl = '', operationalHours = '' }) {
  if (isRealFirebase && db) {
    const docRef = await addDoc(collection(db, 'facilities'), {
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      photoUrl,
      operationalHours: operationalHours.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } else {
    const data = getLocalData();
    const newDoc = {
      id: 'fac-' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      photoUrl,
      operationalHours: operationalHours.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.facilities.push(newDoc);
    saveLocalData(data);
    notifyLocalListeners();
    return newDoc.id;
  }
}

export async function updateFacility(id, updateData) {
  if (isRealFirebase && db) {
    await updateDoc(doc(db, 'facilities', id), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = getLocalData();
    const idx = data.facilities.findIndex(f => f.id === id);
    if (idx !== -1) {
      data.facilities[idx] = {
        ...data.facilities[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function deleteFacility(id) {
  if (isRealFirebase && db) {
    await deleteDoc(doc(db, 'facilities', id));
  } else {
    const data = getLocalData();
    data.facilities = data.facilities.filter(f => f.id !== id);
    saveLocalData(data);
    notifyLocalListeners();
  }
}

// -------------------------------------------------------------
// NOTIFICATIONS (Notifikasi Realtime)
// -------------------------------------------------------------

export function subscribeNotifications(userId, callback) {
  if (isRealFirebase && db) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [userId, 'all', 'admin']),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    }, (err) => {
      console.warn('Notifications listener note:', err);
    });
  } else {
    const check = () => {
      const data = getLocalData();
      const list = (data.notifications || []).filter(n => 
        n.userId === userId || n.userId === 'all' || n.userId === 'admin'
      );
      callback(list);
    };
    check();
    localListeners.add(check);
    return () => localListeners.delete(check);
  }
}

export async function createNotification({ userId, title, message, type = 'info', link = '' }) {
  if (isRealFirebase && db) {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = getLocalData();
    data.notifications.unshift({
      id: 'notif-' + Date.now(),
      userId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    saveLocalData(data);
    notifyLocalListeners();
  }
}

export async function markNotificationAsRead(id) {
  if (isRealFirebase && db) {
    await updateDoc(doc(db, 'notifications', id), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = getLocalData();
    const notif = data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      saveLocalData(data);
      notifyLocalListeners();
    }
  }
}

export async function markAllNotificationsAsRead(userId) {
  if (isRealFirebase && db) {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(doc(db, 'notifications', d.id), { read: true });
    }
  } else {
    const data = getLocalData();
    data.notifications.forEach(n => {
      if (n.userId === userId || n.userId === 'all') n.read = true;
    });
    saveLocalData(data);
    notifyLocalListeners();
  }
}

export async function deleteNotification(id) {
  if (isRealFirebase && db) {
    await deleteDoc(doc(db, 'notifications', id));
  } else {
    const data = getLocalData();
    data.notifications = data.notifications.filter(n => n.id !== id);
    saveLocalData(data);
    notifyLocalListeners();
  }
}

// -------------------------------------------------------------
// STORAGE / FILE UPLOAD
// -------------------------------------------------------------

export async function uploadImageFile(file, folder = 'general') {
  if (!file) return '';

  if (isRealFirebase && storage) {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (e) {
      console.warn('Firebase Storage upload failed, falling back to data URL:', e);
    }
  }

  // Fallback: Read as base64 Data URL (guarantees local display without broken image)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
