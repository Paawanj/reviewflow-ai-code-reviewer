import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import GitHubOAuthCallbackPage from "@/pages/GitHubOAuthCallbackPage";
import HomePage from "@/pages/HomePage";
import PullRequestsPage from "@/pages/PullRequestsPage";
import RepositoriesPage from "@/pages/RepositoriesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/oauth/callback" element={<GitHubOAuthCallbackPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/repositories" element={<RepositoriesPage />} />
        <Route path="/pull-requests" element={<PullRequestsPage />} />
      </Route>
    </Routes>
  );
}
