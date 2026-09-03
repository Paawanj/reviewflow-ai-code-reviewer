/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { clearAccessToken, setAccessToken } from "@/lib/authToken";
import { logoutUser, refreshSession } from "@/services/authApi";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const hasRestoredSession = useRef(false);

  useEffect(() => {
  if (hasRestoredSession.current) return;
  hasRestoredSession.current = true;

  async function restoreSession() {
    try {
      const session = await refreshSession();
      setAccessToken(session.accessToken);
      setUser(session.user);
    } catch {
      clearAccessToken();
      setUser(null);
    } finally {
      setIsLoadingSession(false);
    }
  }

  restoreSession();
}, []);

  function completeAuthentication(result) {
    setAccessToken(result.accessToken);
    setUser(result.user);
  }

  async function logout() {
  try {
    await logoutUser();
  } finally {
    clearAccessToken();
    setUser(null);
  }
}

  return (
    <AuthContext.Provider value={{ user, isLoadingSession, completeAuthentication, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
