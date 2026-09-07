import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("coopserve_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token, userData) => {
    localStorage.setItem("coopserve_token", token);
    localStorage.setItem("coopserve_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("coopserve_token");
    localStorage.removeItem("coopserve_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
