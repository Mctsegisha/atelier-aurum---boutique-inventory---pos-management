import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types.ts';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../api.ts';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  login: (credential: string, password: string) => Promise<void>;
  quickSwitch: (role: Role) => Promise<void>;
  logout: () => void;
  hasPermission: (key: string) => boolean;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        clearStoredToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (credential: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(credential, password);
      setStoredToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const quickSwitch = async (targetRole: Role) => {
    setIsLoading(true);
    try {
      const res = await api.quickSwitch(targetRole);
      setStoredToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
  };

  const hasPermission = (key: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return Boolean(user.permissions && user.permissions.includes(key));
  };

  const hasRole = (roles: Role[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        login,
        quickSwitch,
        logout,
        hasPermission,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
