import React from 'react';
import { 
  Megaphone, 
  CalendarDays, 
  AlertTriangle, 
  MessageSquare, 
  Building2, 
  Users, 
  UserCircle, 
  LayoutDashboard, 
  UserCheck, 
  Bell,
  Shield,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { isAdmin } = useAuth();

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

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        {isAdmin && (
          <div className="px-3 py-1.5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              Panel Pengurus RT/RW
            </span>
          </div>
        )}

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-700'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Security info card on sidebar footer */}
      <div className="mt-auto pt-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-3.5 border border-emerald-100/80">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Info Komplek GP4</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Portal digital resmi untuk ketertiban, keamanan, dan keharmonisan bersama.
          </p>
          <div className="mt-3 pt-2.5 border-t border-emerald-200/50 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Security Gate:</span>
            <span className="font-semibold text-emerald-900">24 Jam Aktif</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
