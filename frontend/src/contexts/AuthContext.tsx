'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, profileAPI } from '@/lib/api';

export type UserRole = 'superadmin' | 'admin' | 'empleado' | 'cliente';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  is_store_owner: boolean;
  role: UserRole;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData && userData !== 'undefined' && userData !== 'null') {
      try { setUser(JSON.parse(userData)); } catch { localStorage.removeItem('user_data'); }
    }
    setIsLoading(false);
  }, []);

  const saveUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  const login = async (username: string, password: string): Promise<User> => {
    const response = await authAPI.login(username, password);
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    const userData: User = response.data.user;
    saveUser(userData);
    return userData;
  };

  const register = async (data: any): Promise<User> => {
    await authAPI.register(data);
    return await login(data.username, data.password);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await profileAPI.get();
      saveUser(res.data as User);
    } catch { /* silencioso */ }
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
