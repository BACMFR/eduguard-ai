import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginRequest, logoutRequest } from "../api/auth";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem("eduguard_user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("eduguard_token"));
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrapAuth() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);
        localStorage.setItem("eduguard_user", JSON.stringify(currentUser));
      } catch (error) {
        console.error(error);
        localStorage.removeItem("eduguard_token");
        localStorage.removeItem("eduguard_user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrapAuth();
  }, [token]);

  async function login(email, password) {
    const response = await loginRequest({
      email,
      password,
    });

    localStorage.setItem("eduguard_token", response.token);
    localStorage.setItem("eduguard_user", JSON.stringify(response.user));

    setToken(response.token);
    setUser(response.user);

    return response.user;
  }

  async function logout() {
    try {
      if (token) {
        await logoutRequest();
      }
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("eduguard_token");
      localStorage.removeItem("eduguard_user");
      setToken(null);
      setUser(null);
    }
  }

  function hasPermission(permission) {
    return user?.permissions?.includes(permission);
  }

  function hasRole(role) {
    return user?.roles?.includes(role);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      hasPermission,
      hasRole,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}