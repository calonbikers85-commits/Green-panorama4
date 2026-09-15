import React from 'react';
import { 
  X, 
  Megaphone, 
  CalendarDays, 
  AlertTriangle, 
  MessageSquare, 
  Building2, 
  Users, 
  Bell, 
  UserCircle, 
  LayoutDashboard, 
  UserCheck, 
  Settings, 
  LogOut,
  Shield,
  PhoneCall,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';

export default function MobileDrawer({ isOpen, onClose, activeTab, setActiveTab, onOpenConfigModal }) {
  const { userProfile, isAdmin, logout, isRealFirebase } = useAuth();

  if (!isOpen) return null;

  const residentNavItems = [
    { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
    { id: 'activities', label: 'Kegiatan Warga', icon: CalendarDays },
    { id: 'reports', label: 'Laporan & Pengaduan', icon: AlertTriangle },
    { id: 'forum', label: 'Forum Komunitas', icon: MessageSquare },
    { id: 'facilities', label: 'Fasilitas Komplek', icon: Building2 },
    { id: 'directory', label: 'Direktori Warga', icon: Users },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'profile', label: 'Profil Saya', icon: UserCircle },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard Statistik', icon: LayoutDashboard },
    { id: 'residents', label: 'Kelola & Validasi Warga', icon: UserCheck },
    ...residentNavItems
  ];

  const items = isAdmin ? adminNavItems : residentNavItems;

  const handleSelect = (id) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
              GP4
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-800">Green Panorama 4</p>
              <p className="text-[10px] text-slate-400">Portal Warga</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-100 bg-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center text-sm overflow-hidden">
              {userProfile?.photoUrl ? (
                <img src={userProfile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                userProfile?.fullName?.charAt(0) || 'W'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{userProfile?.fullName}</p>
              <p className="text-[10px] text-emerald-800 font-medium truncate">
                Blok {userProfile?.block || '-'} No. {userProfile?.houseNumber || '-'}
              </p>
              <div className="mt-1">
                <Badge variant={isAdmin ? 'purple' : 'primary'} size="sm">
                  {isAdmin ? 'Admin RT/RW' : 'Warga'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer footer */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/60">
          <button
            onClick={() => { onClose(); onOpenConfigModal(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 rounded-xl"
          >
            <Database className="w-4 h-4" />
            <span>Koneksi Firebase ({isRealFirebase ? 'Live' : 'Atur'})</span>
          </button>

          <button
            onClick={() => { onClose(); logout(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
