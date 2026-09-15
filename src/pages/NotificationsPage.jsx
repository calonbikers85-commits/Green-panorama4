import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Megaphone, 
  AlertTriangle, 
  UserCheck, 
  Info,
  Clock 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  subscribeNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '../firebase/services';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';

export default function NotificationsPage({ onNavigate }) {
  const { userProfile, currentUser } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeNotifications(currentUser.uid || userProfile?.uid, (list) => {
      setNotifications(list);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser, userProfile]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(currentUser?.uid || userProfile?.uid);
      toast.success('Semua notifikasi ditandai sudah dibaca.');
    } catch (e) {
      toast.error('Gagal memperbarui notifikasi: ' + e.message);
    }
  };

  const handleClickItem = async (notif) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.link && onNavigate) {
      onNavigate(notif.link);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-emerald-600" />;
      case 'report':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'approval':
        return <UserCheck className="w-5 h-5 text-sky-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatDate = (val) => {
    if (!val) return 'Baru saja';
    try {
      const d = val?.toDate ? val.toDate() : new Date(val);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Pemberitahuan Sistem</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Notifikasi Saya
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Update pengumuman komplek, perubahan status laporan Anda, dan info akun.
          </p>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Tandai Semua Dibaca</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Tidak Ada Notifikasi"
          description="Semua pemberitahuan Anda sudah dibaca atau belum ada pembaruan baru."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClickItem(n)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                n.read
                  ? 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                  : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 text-slate-900 shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold truncate">
                    {n.title}
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(n.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {n.message}
                </p>
              </div>

              <button
                onClick={(e) => handleDelete(e, n.id)}
                className="text-slate-300 hover:text-rose-600 p-1 rounded-lg shrink-0 transition-colors"
                title="Hapus notifikasi"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
