import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await authService.getCurrentUser();
      setUser(user);
      return user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  // Any service can fire this when it gets a 401 — treat it as an expired session.
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('sn:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('sn:unauthorized', handleUnauthorized);
  }, []);

  const login = async (payload) => {
    const { user } = await authService.login(payload);
    setUser(user);
    return user;
  };

  const register = async (payload) => {
    const { user } = await authService.register(payload);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
