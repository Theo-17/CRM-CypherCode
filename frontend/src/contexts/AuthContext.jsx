import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch {
          localStorage.removeItem('auth_token');
        }
      }
      setInitialLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('auth_token', data.token);
    setCurrentUser(data.user);
    return data;
  };

  const signup = async (name, email, password) => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Signup failed');
    localStorage.setItem('auth_token', data.token);
    setCurrentUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
  };

  const getCurrentUserPlan = () => currentUser?.plan || 'gratis';
  const getCurrentUserRole = () => currentUser?.role || currentUser?.rol || 'vendedor';

  const checkFeatureLimit = async () => {
    if (!currentUser) return { allowed: true, current: 0, limit: -1, plan: 'gratis' };
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/features/validate-feature-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error();
      return await response.json();
    } catch {
      return { allowed: true, current: 0, limit: -1, plan: getCurrentUserPlan() };
    }
  };

  const value = {
    currentUser,
    login, signup, logout,
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
