import React from 'react';
import { 
  Megaphone, 
  CalendarDays, 
  AlertTriangle, 
  MessageSquare, 
  LayoutDashboard,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ activeTab, setActiveTab, onOpenMobileMenu }) {
  const { isAdmin } = useAuth();

  const residentNav = [
    { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
    { id: 'activities', label: 'Kegiatan', icon: CalendarDays },
    { id: 'reports', label: 'Laporan', icon: AlertTriangle },
    { id: 'forum', label: 'Forum', icon: MessageSquare },
  ];

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
    { id: 'reports', label: 'Laporan', icon: AlertTriangle },
    { id: 'forum', label: 'Forum', icon: MessageSquare },
  ];

  const primaryItems = isAdmin ? adminNav : residentNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-safe">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center gap-1 transition-colors group"
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-emerald-600 rounded-b-full shadow-sm" />
              )}
              <Icon 
                className={`w-5 h-5 transition-transform group-active:scale-90 ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-400'
                }`} 
              />
              <span 
                className={`text-[10px] font-medium leading-none ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More / Menu Drawer trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="relative flex flex-col items-center justify-center gap-1 transition-colors group text-slate-500 hover:text-emerald-700"
        >
          <Menu className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
}
