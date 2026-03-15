import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginApi, meApi, registerApi } from "@/lib/auth/authApi";
import type { AuthUser } from "@/lib/auth/types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "portfolio_auth_token";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const savedToken = localStorage.getItem(STORAGE_KEY);
      if (!savedToken) {
        setAuthLoading(false);
        return;
      }

      try {
        const me = await meApi(savedToken);
        setToken(savedToken);
        setUser(me.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginApi({ email, password });
    localStorage.setItem(STORAGE_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await registerApi({ name, email, password });
    localStorage.setItem(STORAGE_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      authLoading,
      login,
      register,
      logout,
    }),
    [user, token, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
