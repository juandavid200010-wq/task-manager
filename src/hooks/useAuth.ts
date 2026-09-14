import { useContext } from "react";
import { AuthContext } from "../features/auth/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth debe ser utilizado estrictamente dentro de un AuthProvider");
  }

  return context;
}