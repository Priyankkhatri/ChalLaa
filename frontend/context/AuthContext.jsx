import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check SecureStore for existing session on app startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('accessToken');
        const storedUser = await SecureStore.getItemAsync('user');

        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.warn('[AuthContext CheckAuth Error]', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken: token, refreshToken, user: userData } = response.data;

    await SecureStore.setItemAsync('accessToken', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));

    setAccessToken(token);
    setUser(userData);
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    const { accessToken: token, refreshToken, user: userData } = response.data;

    await SecureStore.setItemAsync('accessToken', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));

    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
    } catch (error) {
      console.warn('[Auth Logout Clean Error]', error);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateUser = async (updatedData) => {
    const response = await api.put('/users/me', updatedData);
    const updatedUser = response.data.user;
    await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get('/users/me');
      const latestUser = response.data.user;
      await SecureStore.setItemAsync('user', JSON.stringify(latestUser));
      setUser(latestUser);
    } catch (error) {
      console.warn('[Auth RefreshProfile Error]', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!accessToken && !!user,
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
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
