import  {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";

import {
  getMe,
  logoutUser,
} from "../api/user/userauth";

import type { AuthUser } from "../api/user/userauth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isLoggedIn: boolean;

  loginOpen: boolean;

  openLogin: () => void;
  closeLogin: () => void;

  login: (user: AuthUser) => void;
  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = () => setLoginOpen(true);

  const closeLogin = () => setLoginOpen(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();

      setUser(res.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (loggedUser: AuthUser) => {
    setUser(loggedUser);

    setLoginOpen(false);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,

        loading,

        isLoggedIn: !!user,

        loginOpen,

        openLogin,

        closeLogin,

        login,

        logout,

        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return ctx;
}