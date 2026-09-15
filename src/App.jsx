import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import MobileDrawer from './components/MobileDrawer';
import FirebaseConfigModal from './components/FirebaseConfigModal';

// Pages
import AuthPage from './pages/AuthPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ReportsPage from './pages/ReportsPage';
import ForumPage from './pages/ForumPage';
import FacilitiesPage from './pages/FacilitiesPage';
import DirectoryPage from './pages/DirectoryPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminResidentsPage from './pages/admin/AdminResidentsPage';

function MainApp() {
  const { currentUser, userProfile, loading, isAdmin, isApproved, isPending, isRejected } = useAuth();
  const [activeTab, setActiveTab] = useState('announcements');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Set default tab on load based on role
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'admin' && activeTab === 'announcements') {
        setActiveTab('dashboard');
      }
    }
  }, [userProfile?.role]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 mb-4 animate-bounce">
          <img src="/favicon.svg" alt="GP4" className="w-full h-full object-contain" />
        </div>
        <p className="text-sm font-bold text-emerald-200 tracking-wide">
          Memuat Green Panorama 4...
        </p>
      </div>
    );
  }

  // Not logged in -> Auth Screen
  if (!currentUser || !userProfile) {
    return (
      <>
        <AuthPage onOpenConfigModal={() => setIsConfigModalOpen(true)} />
        <FirebaseConfigModal 
          isOpen={isConfigModalOpen} 
          onClose={() => setIsConfigModalOpen(false)} 
        />
      </>
    );
  }

  // Pending or Rejected state for resident (Prompt requirement: warga tidak boleh langsung akses sebelum disetujui admin)
  if (!isAdmin && (isPending || isRejected)) {
    return (
      <>
        <PendingApprovalPage />
        <FirebaseConfigModal 
          isOpen={isConfigModalOpen} 
          onClose={() => setIsConfigModalOpen(false)} 
        />
      </>
    );
  }

  // Approved Resident or Admin Portal
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 min-w-0">
          {activeTab === 'dashboard' && isAdmin && (
            <AdminDashboardPage onNavigate={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'residents' && isAdmin && (
            <AdminResidentsPage />
          )}
          {activeTab === 'announcements' && (
            <AnnouncementsPage />
          )}
          {activeTab === 'activities' && (
            <ActivitiesPage />
          )}
          {activeTab === 'reports' && (
            <ReportsPage />
          )}
          {activeTab === 'forum' && (
            <ForumPage />
          )}
          {activeTab === 'facilities' && (
            <FacilitiesPage />
          )}
          {activeTab === 'directory' && (
            <DirectoryPage />
          )}
          {activeTab === 'notifications' && (
            <NotificationsPage onNavigate={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'profile' && (
            <ProfilePage onOpenConfigModal={() => setIsConfigModalOpen(true)} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* Firebase Setup Modal */}
      <FirebaseConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
