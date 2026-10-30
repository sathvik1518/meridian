import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as api from "../services/api";
import { toast } from "../store/toastStore";

const AuthContext = createContext(null);

const CHANNEL = "meridian-auth";

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const channel = useRef(null);
  const clearLocal = useCallback(() => {
    setSession(null);
    setStatus("anonymous");
    queryClient.clear(); // never leave one user's data in memory for the next
  }, [queryClient]);
  // On first load, ask the server "who am I?". A valid cookie means we're still signed in.
  useEffect(() => {
    const controller = new AbortController();
    api
      .fetchSession(controller.signal)
      .then((s) => {
        setSession(s);
        setStatus("authenticated");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("anonymous");
      });
    return () => controller.abort();
  }, []);
  // Any 401 from any request = the session is gone. Sign out once, tell the user.
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      setSession((current) => {
        if (current) toast.info("Signed out", "Your session ended. Please sign in again.");
        return null;
      });
      setStatus("anonymous");
      queryClient.clear();
    });
    return () => api.setUnauthorizedHandler(null);
  }, [queryClient]);
  // Signing in or out in one tab updates the other tabs.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return undefined;
    const bc = new BroadcastChannel(CHANNEL);
    channel.current = bc;
    bc.onmessage = (e) => {
      if (e.data === "logout") clearLocal();
      if (e.data === "login") window.location.reload();
    };
    return () => bc.close();
  }, [clearLocal]);
  const login = useCallback(
    async ({ email, password, remember }) => {
      const next = await api.login(email, password, remember);
      queryClient.clear();
      setSession(next);
      setStatus("authenticated");
      channel.current?.postMessage("login");
      return next.user;
    },
    [queryClient],
  );
  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      clearLocal();
      channel.current?.postMessage("logout");
    }
  }, [clearLocal]);
  // Sign out automatically when the session runs out.
  useEffect(() => {
    if (!session) return undefined;
    const ms = Math.max(0, session.expiresAt - Date.now());
    const timer = setTimeout(
      () => {
        clearLocal();
        toast.info("Session expired", "Please sign in again.");
      },
      Math.min(ms, 2 ** 31 - 1),
    );
    return () => clearTimeout(timer);
  }, [session, clearLocal]);
  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      status,
      isAuthenticated: status === "authenticated",
      login,
      logout,
      hasRole: (...roles) => (session?.user ? roles.includes(session.user.role) : false),
    }),
    [session, status, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
