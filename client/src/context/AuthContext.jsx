import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    role: String(user.role || "").toLowerCase(),
  };
}

function readStored() {
  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role");
  const role = storedRole ? storedRole.toLowerCase() : null;
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? normalizeUser(JSON.parse(rawUser)) : null;
  return { token, role, user };
}

export function AuthProvider({ children }) {
  const [{ token, role, user }, setState] = useState(() => readStored());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (role) localStorage.setItem("role", role);
    else localStorage.removeItem("role");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [token, role, user]);

  async function login({ email, password, role, usn, adminId }) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password, role, usn, adminId });
      const normalized = normalizeUser(data.user);
      setState({ token: data.token, role: normalized?.role, user: normalized });
      return normalized;
    } finally {
      setLoading(false);
    }
  }

  async function register({ name, email, password, role, usn, adminId, adminSecret }) {
    setLoading(true);
    try {
      const headers = {};
      if (adminSecret) headers["x-admin-secret"] = adminSecret;
      const { data } = await api.post(
        "/auth/register",
        { name, email, password, role, usn, adminId },
        { headers }
      );
      const normalized = normalizeUser(data.user);
      setState({ token: data.token, role: normalized?.role, user: normalized });
      return normalized;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setState({ token: null, role: null, user: null });
  }

  const value = useMemo(
    () => ({
      token,
      role,
      user,
      loading,
      isAuthed: Boolean(token && role && user),
      login,
      register,
      logout,
    }),
    [token, role, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

