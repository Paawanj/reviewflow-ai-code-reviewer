import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, isLoadingSession } = useAuth();
  const location = useLocation();

  if (isLoadingSession) {
    return <main className="grid min-h-screen place-items-center text-slate-600">Checking your session...</main>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
