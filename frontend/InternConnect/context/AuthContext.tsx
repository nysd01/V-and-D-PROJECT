import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { api, setAuthToken, ApiUser } from '../services/api';

const TOKEN_KEY = 'auth_token';

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
  loginWithGoogle: (accessToken: string) => Promise<User>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from storage on app launch
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const apiUser = await api.auth.me();
          setUser(toUser(apiUser));
        }
      } catch {
        try { await AsyncStorage.removeItem(TOKEN_KEY); } catch {}
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistToken = async (token: string) => {
    setAuthToken(token);
    try { await AsyncStorage.setItem(TOKEN_KEY, token); } catch {}
  };

  const login = async (email: string, password: string): Promise<User> => {
    const { token, user: apiUser } = await api.auth.login(email, password);
    await persistToken(token);
    const u = toUser(apiUser);
    setUser(u);
    return u;
  };

  const register = async (data: Record<string, unknown>): Promise<User> => {
    const payload = {
      ...data,
      type: data.userType ?? data.type,
      name: data.fullName ?? data.companyName ?? data.name,
    };
    const { token, user: apiUser } = await api.auth.register(payload);
    await persistToken(token);
    const u = toUser(apiUser);
    setUser(u);
    return u;
  };

  const loginWithGoogle = async (accessToken: string): Promise<User> => {
    const { token, user: apiUser } = await api.auth.googleLogin(accessToken);
    await persistToken(token);
    const u = toUser(apiUser);
    setUser(u);
    return u;
  };

  const logout = async () => {
    setAuthToken(null);
    setUser(null);
    try { await AsyncStorage.removeItem(TOKEN_KEY); } catch {}
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  const refreshUser = async () => {
    try {
      const apiUser = await api.auth.me();
      setUser(toUser(apiUser));
    } catch {
      // Token expired or revoked — force logout
      await logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithGoogle, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
