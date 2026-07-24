// Compat shim — kept so existing imports (`@/context/AuthContext`) keep working.
// The real implementation lives in @/state/AuthContext.tsx.
export { AuthProvider, useAuth } from "@/state/AuthContext";
