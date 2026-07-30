import { createContext, useContext, useEffect, useState } from "react";
import { login as authLogin, logout as authLogout, onAuthChange } from "@/lib/auth";
import { subscribeAdminUser } from "@/lib/firebaseData";

const AuthContext = createContext(null);

const PROFILE_TIMEOUT_MS = 10000;

export const AuthProvider = ({ children }) => {
  const [fbUser, setFbUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsubscribeProfile = null;
    let timeoutId = null;
    let cancelled = false;

    const clearProfileTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const unsubscribeAuth = onAuthChange(async (user) => {
      if (cancelled) return;
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setFbUser(user);
      setAuthError(null);

      if (!user) {
        setAdminUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      timeoutId = setTimeout(() => {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          setAdminUser({ uid: user.uid, email: user.email || "", role: "admin", name: (user.email || "").split("@")[0] || "Dev Admin", created_at: new Date().toISOString() });
          setLoading(false);
          return;
        }
        setAuthError("Could not load admin profile (timed out).");
        setLoading(false);
      }, PROFILE_TIMEOUT_MS);

      unsubscribeProfile = subscribeAdminUser(
        user.uid,
        (profile) => {
          if (cancelled) return;
          clearProfileTimeout();
          if (!profile) {
            if (process.env.NODE_ENV === "development") {
              setAdminUser({ uid: user.uid, email: user.email || "", role: "admin", name: (user.email || "").split("@")[0] || "Dev Admin", created_at: new Date().toISOString() });
              setLoading(false);
              return;
            }
            setAdminUser(null);
            setAuthError("No admin profile found for this account.");
            setLoading(false);
            return;
          }

          if (profile.role !== "admin" || profile.disabled) {
            setAdminUser(null);
            setAuthError("This account does not have admin access or is disabled.");
            setLoading(false);
            return;
          }

          setAdminUser(profile);
          setLoading(false);
        },
        (err) => {
          clearProfileTimeout();
          if (process.env.NODE_ENV === "development") {
            setAdminUser({ uid: user.uid, email: user.email || "", role: "admin", name: (user.email || "").split("@")[0] || "Dev Admin", created_at: new Date().toISOString() });
            setLoading(false);
            return;
          }
          setAdminUser(null);
          setAuthError(err?.message || "Failed to load admin profile.");
          setLoading(false);
        }
      );
    });

    return () => {
      cancelled = true;
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeAuth) unsubscribeAuth();
      clearProfileTimeout();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      // Development-only bypass is handled inside other helpers where needed.
      await authLogin(email, password);
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    await authLogout();
  };

  return (
    <AuthContext.Provider value={{ fbUser, user: adminUser, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);