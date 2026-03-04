import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, User, RegisterData, LoginData } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<{ passwordExpired?: boolean }>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ resetToken?: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  // Charger le profil au démarrage si un token existe
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await authService.getMe(token);
        if (!data.user || !data.user.id || !data.user.email || !data.user.role) {
          console.error('Données utilisateur invalides:', data);
          clearAuth();
          setIsLoading(false);
          return;
        }
        setUser(data.user);
        setAccessToken(token);
      } catch (error) {
        console.error('Erreur de chargement du profil:', error);
        // token invalide, essayer de rafraîchir
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshData = await authService.refresh(refreshToken);
            localStorage.setItem('accessToken', refreshData.accessToken);
            setAccessToken(refreshData.accessToken);
            const userData = await authService.getMe(refreshData.accessToken);
            
            // vérifier à nouveau que les données sont valides
            if (!userData.user || !userData.user.id || !userData.user.email || !userData.user.role) {
              console.error('Données utilisateur invalides après rafraîchissement:', userData);
              clearAuth();
              setIsLoading(false);
              return;
            }
            
            setUser(userData.user);
          } catch (refreshError) {
            console.error('Erreur de rafraîchissement du token:', refreshError);
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [clearAuth]);

  const login = async (data: LoginData) => {
    const response = await authService.login(data);
    setUser(response.user);
    setAccessToken(response.accessToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return { passwordExpired: response.passwordExpired };
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    setUser(response.user);
    setAccessToken(response.accessToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken && accessToken) {
        await authService.logout(refreshToken, accessToken);
      }
    } finally {
      clearAuth();
    }
  };

  const forgotPassword = async (email: string) => {
    const response = await authService.forgotPassword(email);
    return { resetToken: response.resetToken };
  };

  const resetPassword = async (token: string, password: string) => {
    await authService.resetPassword(token, password);
    clearAuth();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
