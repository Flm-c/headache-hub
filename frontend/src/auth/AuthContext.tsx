import { createContext, useEffect, useState } from 'react';
import { fetchCurrentUser, loginAccount, logoutAccount, registerAccount } from '../api/auth';
import { clearStoredToken, getStoredToken, setStoredToken } from './storage';
import { LoginRequest, RegisterRequest, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<User>;
  register: (payload: RegisterRequest) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();

      
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        setToken(storedToken);
      } catch (error) {
        clearStoredToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  const login = async (payload: LoginRequest): Promise<User> => {
    const authPayload = await loginAccount(payload);
    setStoredToken(authPayload.token);
    setToken(authPayload.token);
    setUser(authPayload.user);

    return authPayload.user;
  };

  const register = async (payload: RegisterRequest): Promise<User> => {
    return registerAccount(payload);
  };

  const logout = (): void => {
    void logoutAccount(); // best-effort: clears httpOnly cookie on server
    clearStoredToken();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async (): Promise<void> => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
