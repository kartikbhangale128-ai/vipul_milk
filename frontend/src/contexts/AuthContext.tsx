import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface AuthContextType {
  authenticated: boolean;
  username: string | null;
  fullName: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkStatus = async () => {
    try {
      const res = await api.get('/auth/status');
      if (res.data.authenticated) {
        setAuthenticated(true);
        setUsername(res.data.username);
        setFullName(res.data.fullName);
      } else {
        setAuthenticated(false);
      }
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const login = async (u: string, p: string) => {
    const res = await api.post('/auth/login', { username: u, password: p });
    if (res.data.authenticated) {
      setAuthenticated(true);
      setUsername(res.data.username);
      setFullName(res.data.fullName);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAuthenticated(false);
      setUsername(null);
      setFullName(null);
    }
  };

  return (
    <AuthContext.Provider value={{ authenticated, username, fullName, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

