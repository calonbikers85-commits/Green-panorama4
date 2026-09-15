import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  User, 
  LogOut, 
  Settings as SettingsIcon, 
  PhoneCall, 
  ChevronDown,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeNotifications } from '../firebase/services';
import Badge from './Badge';

export default function Navbar({ activeTab, setActiveTab, onOpenConfigModal }) {
  const { userProfile, currentUser, isAdmin, logout, isRealFirebase } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeNotifications(currentUser.uid || userProfile?.uid, (notifs) => {
      const unread = notifs.filter(n => !n.read).length;
      setUnreadCount(unread);
    });
    return () => unsub();
  }, [currentUser, userProfile]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div 
            onClick={() => setActiveTab(isAdmin ? 'dashboard' : 'announcements')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <img 
                src="/favicon.svg" 
                alt="GP4" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-800 tracking-tight leading-none">
                  Green Panorama <span className="text-emerald-600">4</span>
                </span>
                <span className="hidden sm:inline-flex">
                  <Badge variant={isAdmin ? 'purple' : 'primary'} size="sm">
                    {isAdmin ? 'Admin RT/RW' : 'Warga'}
                  </Badge>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5 hidden xs:block">
                Portal Digital Warga Komplek
              </p>
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Firebase / Demo Mode Indicator */}
            <button
              onClick={onOpenConfigModal}
              title={isRealFirebase ? "Firebase Terhubung Online" : "Klik untuk atur Firebase credentials"}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                isRealFirebase
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isRealFirebase ? 'Firebase Live' : 'Atur Firebase'}</span>
            </button>

            {/* Emergency Hotline Button */}
            <a
              href="tel:081234567890"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span>Pos Satpam 24 Jam</span>
            </a>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs overflow-hidden shadow-inner">
                  {userProfile?.photoUrl ? (
                    <img src={userProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    userProfile?.fullName?.charAt(0) || 'W'
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {userProfile?.fullName || 'Warga'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {userProfile?.block ? `Blok ${userProfile.block}-${userProfile.houseNumber}` : 'Green Panorama'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800 truncate">{userProfile?.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{userProfile?.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge variant={userProfile?.status === 'approved' ? 'success' : 'warning'} size="sm">
                          {userProfile?.status === 'approved' ? 'Terverifikasi' : 'Menunggu'}
                        </Badge>
                      </div>
                    </div>

                    <button
                      onClick={() => { setActiveTab('profile'); setShowDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
                    >
                      <User className="w-4 h-4" />
                      <span>Profil & Rumah Saya</span>
                    </button>

                    <button
                      onClick={() => { onOpenConfigModal(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span>Pengaturan Firebase</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => { logout(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
