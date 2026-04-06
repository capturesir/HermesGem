import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import api from '../services/api';
import { toSnakeCase } from '../lib/apiUtils';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, userData: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getUsersByRole: (role: string) => User[];
  getUserById: (id: string) => User | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Check for existing session (token + user)
    const storedToken = localStorage.getItem('emr_token');
    const storedUser = localStorage.getItem('emr_current_user');
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Load users list from API now that we have a token
        api.getUsers().then((response: unknown) => {
          const usersData = response as User[];
          if (Array.isArray(usersData)) setUsers(usersData);
        }).catch(console.error);
      } catch {
        // Corrupt data, clear
        localStorage.removeItem('emr_token');
        localStorage.removeItem('emr_current_user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.login(username, password) as { user: User; token: string };
      const { user: apiUser, token } = response;

      // Store token for API calls
      localStorage.setItem('emr_token', token);
      // Store user data
      localStorage.setItem('emr_current_user', JSON.stringify(apiUser));

      setUser(apiUser);
      window.dispatchEvent(new CustomEvent('auth:loginSuccess'));
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登入失敗';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('emr_token');
    localStorage.removeItem('emr_current_user');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  const register = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!userData.username || !userData.name || !userData.role) {
      return { success: false, error: '請填寫所有必填欄位' };
    }

    try {
      const snakeCaseData = toSnakeCase(userData as Record<string, unknown>);
      const created = await api.createUser(snakeCaseData);
      const apiUser = created as User;
      setUsers(prev => [...prev, apiUser]);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '創建用戶失敗';
      return { success: false, error: message };
    }
  };

  const updateUser = async (id: string, userData: Partial<User>): Promise<boolean> => {
    try {
      const snakeCaseData = toSnakeCase(userData as Record<string, unknown>);
      await api.updateUser(id, snakeCaseData);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
      if (user && user.id === id) {
        setUser({ ...user, ...userData });
      }
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      return false;
    }
  };

  const getUsersByRole = (role: string): User[] => {
    return users.filter(u => u.role === role);
  };

  const getUserById = (id: string): User | undefined => {
    return users.find(u => u.id === id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        updateUser,
        deleteUser,
        getUsersByRole,
        getUserById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
