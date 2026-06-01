import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = 'http://localhost:3000';

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
          const response = await fetch(`${API_URL}/api/auth/me`, {
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

  // Escucha el evento de sesión revocada (admin eliminó al usuario)
  useEffect(() => {
    const handleRevoked = () => setCurrentUser(null);
    window.addEventListener('auth:session-revoked', handleRevoked);
    return () => window.removeEventListener('auth:session-revoked', handleRevoked);
  }, []);

  // Verifica la sesión cada 60 segundos mientras el usuario está logueado
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          setCurrentUser(null);
        }
      } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.message || 'Login failed'), { isPending: data.isPending, needsVerification: data.needsVerification });
    localStorage.setItem('auth_token', data.token);
    setCurrentUser(data.user);
    return data;
  };

  const signup = async (name, email, password, companyName) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, companyName })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Signup failed');
    if (data.needsVerification) return { needsVerification: true };
    localStorage.setItem('auth_token', data.token);
    setCurrentUser(data.user);
    return data;
  };

  const checkEmail = async (email) => {
    const response = await fetch(`${API_URL}/api/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return response.json();
  };

  const activateAccount = async (token, password) => {
    const response = await fetch(`${API_URL}/api/auth/setup-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error al activar cuenta');
    localStorage.setItem('auth_token', data.token);
    setCurrentUser(data.user);
    return data.user;
  };

  const loginWithToken = async (token) => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Sesión inválida');
    localStorage.setItem('auth_token', token);
    setCurrentUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
  };

  const getCurrentUserPlan = () => currentUser?.plan || 'gratis';
  const getCurrentUserRole = () => currentUser?.role || currentUser?.rol || 'admin';

  const checkFeatureLimit = async () => {
    if (!currentUser) return { allowed: true, current: 0, limit: -1, plan: 'gratis' };
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/features/validate-feature-limit`, {
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
    login, signup, logout, loginWithToken,
    checkEmail, activateAccount,
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
