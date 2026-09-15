import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isRealFirebase, configSource } from '../firebase/config';
import {
  subscribeUserProfile,
  loginUser,
  registerResident,
  logoutUser,
  resetPassword,
  updateUserProfile
} from '../firebase/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    if (isRealFirebase && auth) {
      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (user) {
          if (unsubscribeProfile) unsubscribeProfile();
          unsubscribeProfile = subscribeUserProfile(user.uid, (profile) => {
            setUserProfile(profile);
            setLoading(false);
          });
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      });

      return () => {
        unsubscribeAuth();
        if (unsubscribeProfile) unsubscribeProfile();
      };
    } else {
      // Local fallback auth listener
      const currentId = localStorage.getItem('gp4_current_user_id') || 'admin-default';
      setCurrentUser({ uid: currentId, email: currentId === 'admin-default' ? 'admin@greenpanorama.com' : 'warga@greenpanorama.com' });
      unsubscribeProfile = subscribeUserProfile(currentId, (profile) => {
        setUserProfile(profile);
        setLoading(false);
      });

      return () => {
        if (unsubscribeProfile) unsubscribeProfile();
      };
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      setCurrentUser(res.user);
      setUserProfile(res.userProfile);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await registerResident(formData);
      setCurrentUser(res.user);
      setUserProfile(res.userProfile);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateProfile = async (data) => {
    if (!currentUser) return;
    await updateUserProfile(currentUser.uid || userProfile?.uid, data);
  };

  const isAdmin = userProfile?.role === 'admin';
  const isApproved = userProfile?.status === 'approved';
  const isPending = userProfile?.status === 'pending';
  const isRejected = userProfile?.status === 'rejected';

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin,
    isApproved,
    isPending,
    isRejected,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    isRealFirebase,
    configSource,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
