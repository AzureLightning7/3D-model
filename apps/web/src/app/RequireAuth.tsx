import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStore } from "@/features/auth/store";

export function RequireAuth() {
  const tokens = useAuthStore((s) => s.tokens);
  const loc = useLocation();
  if (!tokens?.accessToken) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <Outlet />;
}
