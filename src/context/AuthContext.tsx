import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { initialUsers, generateId } from '../data/initialData';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (userData: Partial<User>) => boolean;
  updateUser: (id: string, userData: Partial<User>) => boolean;
  deleteUser: (id: string) => boolean;
  getUsersByRole: (role: string) => User[];
  getUserById: (id: string) => User | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load users from localStorage
    const storedUsers = localStorage.getItem('emr_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(initialUsers);
      localStorage.setItem('emr_users', JSON.stringify(initialUsers));
    }

    // Check for logged in user
    const storedUser = localStorage.getItem('emr_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('emr_current_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('emr_current_user');
  };

  const register = (userData: Partial<User>): boolean => {
    if (!userData.username || !userData.name || !userData.role) {
      return false;
    }

    const newUser: User = {
      id: generateId(),
      username: userData.username,
      password: userData.password || '123456',
      name: userData.name,
      role: userData.role,
      title: userData.title,
      bio: userData.bio,
      gender: userData.gender || 'unspecified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('emr_users', JSON.stringify(updatedUsers));
    return true;
  };

  const updateUser = (id: string, userData: Partial<User>): boolean => {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    setUsers(updatedUsers);
    localStorage.setItem('emr_users', JSON.stringify(updatedUsers));

    // Update current user if it's the same
    if (user && user.id === id) {
      const updatedUser = { ...user, ...userData, updatedAt: new Date().toISOString() };
      setUser(updatedUser);
      localStorage.setItem('emr_current_user', JSON.stringify(updatedUser));
    }

    return true;
  };

  const deleteUser = (id: string): boolean => {
    if (user && user.id === id) return false; // Can't delete yourself

    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('emr_users', JSON.stringify(updatedUsers));
    return true;
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
