import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  authService,
  User,
  RegisterData,
  LoginData,
} from "../services/auth.service";
import { ApiError } from "../services/api";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<{
    passwordExpired?: boolean;
    requiresTwoFactor?: boolean;
    challengeToken?: string;
  }>;
  verifyTwoFactorLogin: (
    challengeToken: string,
    code: string,
  ) => Promise<{ passwordExpired?: boolean; backupCodeUsed?: boolean }>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken"),
  );
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  // Charger le profil au démarrage si un token existe
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await authService.getMe(token);
        if (
          !data.user ||
          !data.user.id ||
          !data.user.email ||
          !data.user.role
        ) {
          console.error("Données utilisateur invalides:", data);
          clearAuth();
          setIsLoading(false);
          return;
        }
        setUser(data.user);
        setAccessToken(token);
      } catch (error) {
        const isUnauthorized =
          error instanceof ApiError && error.status === 401;
        if (!isUnauthorized) {
          console.error("Erreur de chargement du profil:", error);
        }

        // token invalide, essayer de rafraîchir
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          try {
            const refreshData = await authService.refresh(refreshToken);
            localStorage.setItem("accessToken", refreshData.accessToken);
            setAccessToken(refreshData.accessToken);
            const userData = await authService.getMe(refreshData.accessToken);

            // vérifier à nouveau que les données sont valides
            if (
              !userData.user ||
              !userData.user.id ||
              !userData.user.email ||
              !userData.user.role
            ) {
              console.error(
                "Données utilisateur invalides après rafraîchissement:",
                userData,
              );
              clearAuth();
              setIsLoading(false);
              return;
            }

            setUser(userData.user);
          } catch (refreshError) {
            const refreshUnauthorized =
              refreshError instanceof ApiError && refreshError.status === 401;
            if (!refreshUnauthorized) {
              console.error(
                "Erreur de rafraîchissement du token:",
                refreshError,
              );
            }
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

    if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
      return {
        requiresTwoFactor: true,
        challengeToken: response.challengeToken,
      };
    }

    setUser(response.user);
    setAccessToken(response.accessToken);
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    return { passwordExpired: response.passwordExpired };
  };

  const verifyTwoFactorLogin = async (challengeToken: string, code: string) => {
    const response = await authService.verifyTwoFactorLogin(challengeToken, code);
    setUser(response.user);
    setAccessToken(response.accessToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return {
      passwordExpired: response.passwordExpired,
      backupCodeUsed: response.backupCodeUsed,
    };
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    setUser(response.user);
    setAccessToken(response.accessToken);
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken && accessToken) {
        await authService.logout(refreshToken, accessToken);
      }
    } finally {
      clearAuth();
    }
  };

  const forgotPassword = async (email: string) => {
    await authService.forgotPassword(email);
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
        verifyTwoFactorLogin,
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
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
