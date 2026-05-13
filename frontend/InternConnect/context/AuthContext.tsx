import React, { createContext, useState, useContext, ReactNode } from 'react';
import { api, setAuthToken, ApiUser } from '../services/api';

export type User = {
  id: string;
  email: string;
  name: string;
  type: 'intern' | 'firm';
  profilePicture?: string;
  university?: string;
  companyName?: string;
  industry?: string;
  address?: string;
};

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, unknown>) => Promise<User>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function toUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    name: apiUser.name,
    type: apiUser.type,
    profilePicture: apiUser.profile_picture,
    university: apiUser.university,
    companyName: apiUser.company_name ?? apiUser.companyName,
    industry: apiUser.industry,
    address: apiUser.address,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { token, user: apiUser } = await api.auth.login(email, password);
      setAuthToken(token);
      const u = toUser(apiUser);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Record<string, unknown>): Promise<User> => {
    setIsLoading(true);
    try {
      // Normalize field names: register screen uses userType/fullName,
      // backend expects type/name
      const payload = {
        ...data,
        type: data.userType ?? data.type,
        name: data.fullName ?? data.companyName ?? data.name,
      };
      const { token, user: apiUser } = await api.auth.register(payload);
      setAuthToken(token);
      const u = toUser(apiUser);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
