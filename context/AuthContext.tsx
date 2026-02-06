import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/api';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token is still valid by fetching current user
        const response = await authAPI.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          await AsyncStorage.setItem('auth_user', JSON.stringify(response.data.user));
        } else {
          // Token expired or invalid - clear auth
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
  }, []);

  const clearAuth = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  };

  const refreshUser = useCallback(async () => {
    const response = await authAPI.getMe();
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.data.user));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
