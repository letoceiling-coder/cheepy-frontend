import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAccountAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const hasAnyProjectSession =
    typeof window !== "undefined" &&
    (localStorage.getItem("customer_token") || localStorage.getItem("admin_token"));

  if (!isAuthenticated && !hasAnyProjectSession) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}
