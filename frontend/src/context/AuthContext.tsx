import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

type User = {
  _id: string;
  name: string;
  email: string;
  role?: "user" | "admin";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

type Props = {
  children: ReactNode;
};

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // optional: auto-login if you later store token in async storage
  useEffect(() => {
    // left simple for now
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      // backend returns { message, user, token } :contentReference[oaicite:3]{index=3}
      setUser(res.data.user);
      setToken(res.data.token);
    } catch (err: any) {
      console.log("login error", err?.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
      });

      setUser(res.data.user);
      setToken(res.data.token);
    } catch (err: any) {
      console.log("register error", err?.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // optionally call /api/auth/logout, but backend is stateless :contentReference[oaicite:4]{index=4}
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
