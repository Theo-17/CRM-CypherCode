import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (pb.authStore.isValid) {
        try {
          // Refresh to get latest role and plan
          const authData = await pb.collection('users').authRefresh({ $autoCancel: false });
          setCurrentUser(authData.record);
        } catch (err) {
          pb.authStore.clear();
          setCurrentUser(null);
        }
      }
      setInitialLoading(false);
    };

    initAuth();

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
    setCurrentUser(authData.record);
    return authData;
  };

  const signup = async (name, email, password, empresa) => {
    const data = {
      name,
      email,
      password,
      passwordConfirm: password,
      empresa,
      rol: 'vendedor',
      plan: 'gratis',
      emailVisibility: true
    };
    
    const record = await pb.collection('users').create(data, { $autoCancel: false });
    await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
    setCurrentUser(pb.authStore.model);
    return record;
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const getCurrentUserPlan = () => currentUser?.plan || 'gratis';
  const getCurrentUserRole = () => currentUser?.rol || 'vendedor';

  const checkFeatureLimit = async (feature) => {
    if (!currentUser) return { allowed: false, current: 0, limit: 0, plan: 'gratis' };
    try {
      const response = await apiServerClient.fetch('/features/validate-feature-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          feature
        })
      });
      if (!response.ok) throw new Error('Failed to check limit');
      return await response.json();
    } catch (error) {
      console.error('Feature limit check error:', error);
      return { allowed: true, current: 0, limit: -1, plan: getCurrentUserPlan() }; // Fallback
    }
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    isAuthenticated: !!currentUser,
    getCurrentUserPlan,
    getCurrentUserRole,
    checkFeatureLimit
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};