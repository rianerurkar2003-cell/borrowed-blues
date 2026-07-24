import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/services/auth.service";
import { toAppError } from "@/lib/errors";
import type { User } from "@/lib/types";

/**
 * `user` states:
 *   null       — auth check in progress (initial)
 *   false      — anonymous / auth check finished with no session
 *   User       — signed in
 */
type AuthUser = User | false | null;

interface AuthContextValue {
  user: AuthUser;
  login: (email: string, password: string, remember?: boolean) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);

  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const me = await authService.me();
      setUser(me);
      return me;
    } catch {
      setUser(false);
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login: AuthContextValue["login"] = useCallback(async (email, password, remember = false) => {
    try {
      const me = await authService.login({ email, password, remember });
      setUser(me);
      return { ok: true, user: me };
    } catch (err) {
      return { ok: false, error: toAppError(err).message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* swallow: already signed out */
    }
    setUser(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, setUser, login, logout, refresh }),
    [user, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export type { AuthUser };
